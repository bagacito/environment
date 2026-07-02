import { Environment } from "../../src";

function withEnvironment(
  entries: Record<string, string | undefined>,
  run: () => void
): void {
  const previous = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(entries)) {
    previous.set(key, process.env[key]);

    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    run();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

describe("Environment accumulator behavior", () => {
  it("returns default nested values when uppercase environment variables are missing", () => {
    withEnvironment(
      {
        MODE: undefined,
        NESTED__ID: undefined,
        NESTED__TOKEN: undefined,
        NESTED__ACTIVE: undefined,
        SOME_VAR: undefined,
      },
      () => {
        const environment = Environment.accumulate({
          mode: "test",
          nested: {
            id: 21,
            token: "alpha",
            active: false,
          },
          someVar: "fallback",
        });

        expect(environment.mode).toBe("test");
        expect(environment.nested.id).toBe(21);
        expect(environment.nested.token).toBe("alpha");
        expect(environment.nested.active).toBe(false);
        expect(environment.someVar).toBe("fallback");
      }
    );
  });

  it("reads nested and flat environment overrides on property access", () => {
    withEnvironment(
      {
        MODE: "prod",
        NESTED__ID: "42",
        NESTED__TOKEN: "updated",
        NESTED__ACTIVE: "false",
        SOME_VAR: "custom",
      },
      () => {
        const environment = Environment.accumulate({
          mode: "test",
          nested: {
            id: 1,
            token: "token",
            active: true,
          },
          someVar: "fallback",
        });

        expect(environment.mode).toBe("prod");
        expect(environment.nested.id).toBe(42);
        expect(environment.nested.token).toBe("updated");
        expect(environment.nested.active).toBe(false);
        expect(environment.someVar).toBe("custom");

        process.env.MODE = "staging";
        process.env.NESTED__ID = "7";
        process.env.NESTED__ACTIVE = "true";

        expect(environment.mode).toBe("staging");
        expect(environment.nested.id).toBe(7);
        expect(environment.nested.active).toBe(true);
      }
    );
  });

  it("maps double underscore environment variables to nested object paths", () => {
    withEnvironment(
      {
        BASE__HOSTNAME: "main.example.test",
        BASE__HOSTNAME__URL: "https://main.example.test",
        BASE__HOST_NAME__URL: "https://host-name.example.test",
      },
      () => {
        const environment = Environment.accumulate({
          base: {
            hostname: "default-host",
            hostName: {
              url: "https://default-host-name.example.test",
            },
          },
        });

        expect(environment.base.hostname).toBe("main.example.test");
        expect(environment.base.hostName.url).toBe(
          "https://host-name.example.test"
        );

        process.env.BASE__HOSTNAME = "updated.example.test";
        process.env.BASE__HOST_NAME__URL = "https://updated.example.test";

        expect(environment.base.hostname).toBe("updated.example.test");
        expect(environment.base.hostName.url).toBe(
          "https://updated.example.test"
        );
      }
    );
  });

  it("ignores environment variables that are not declared in the default object shape", () => {
    withEnvironment(
      {
        SOME_OTHER_VAR: "someothervalue",
        SOME____OTHER__VAR: "ignored",
        MODE: undefined,
      },
      () => {
        const environment = Environment.accumulate({
          mode: "testing",
        });

        expect(environment.mode).toBe("testing");
      }
    );
  });

  it("rejects malformed repeated double underscores when they target a declared property", () => {
    withEnvironment({ BASE____HOSTNAME: "broken" }, () => {
      const environment = Environment.accumulate({
        base: {
          hostname: "default-host",
        },
      });

      let error: unknown;

      try {
        void environment.base.hostname;
      } catch (caughtError) {
        error = caughtError;
      }

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe("INVALID ENVIRONMENT VARIABLE");
    });
  });

  it("rejects leading double underscores when they target a declared property", () => {
    withEnvironment({ _BASE__HOSTNAME: "broken" }, () => {
      const environment = Environment.accumulate({
        base: {
          hostname: "default-host",
        },
      });

      let error: unknown;

      try {
        void environment.base.hostname;
      } catch (caughtError) {
        error = caughtError;
      }

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe("INVALID ENVIRONMENT VARIABLE");
    });
  });

  it("rejects trailing double underscores when they target a declared property", () => {
    withEnvironment({ BASE__HOSTNAME_: "broken" }, () => {
      const environment = Environment.accumulate({
        base: {
          hostname: "default-host",
        },
      });

      let error: unknown;

      try {
        void environment.base.hostname;
      } catch (caughtError) {
        error = caughtError;
      }

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe("INVALID ENVIRONMENT VARIABLE");
    });
  });

  it("parses strings, booleans, and numbers from uppercase environment variables", () => {
    withEnvironment(
      {
        NESTED__ID: "42",
        NESTED__TOKEN: "Morgan",
        NESTED__ACTIVE: "true",
      },
      () => {
        const environment = Environment.accumulate({
          nested: {
            id: 18,
            token: "alice",
            active: false,
          },
        });

        expect(environment.nested.id).toBe(42);
        expect(environment.nested.token).toBe("Morgan");
        expect(environment.nested.active).toBe(true);
      }
    );
  });

  it("throws INVALID ENVIRONMENT VARIABLE for invalid parsed values on nested properties", () => {
    withEnvironment({ NESTED__ID: "not-a-number" }, () => {
      const environment = Environment.accumulate({
        nested: {
          id: 18,
        },
      });

      let error: unknown;

      try {
        void environment.nested.id;
      } catch (caughtError) {
        error = caughtError;
      }

      expect(error).toBeInstanceOf(Error);

      const typedError = error as Error;

      expect(typedError.name).toBe("INVALID ENVIRONMENT VARIABLE");
      expect(typedError.message).toContain("NESTED__ID");
      expect(typedError.message).toContain("number");
      expect(typedError.message).toContain("string");
    });
  });

  it("throws INVALID ENVIRONMENT VARIABLE for invalid boolean values on nested properties", () => {
    withEnvironment({ NESTED__ACTIVE: "maybe" }, () => {
      const environment = Environment.accumulate({
        nested: {
          active: true,
        },
      });

      let error: unknown;

      try {
        void environment.nested.active;
      } catch (caughtError) {
        error = caughtError;
      }

      expect(error).toBeInstanceOf(Error);

      const typedError = error as Error;

      expect(typedError.name).toBe("INVALID ENVIRONMENT VARIABLE");
      expect(typedError.message).toContain("NESTED__ACTIVE");
      expect(typedError.message).toContain("boolean");
    });
  });

  it("returns empty arrays when no indexed environment variables are present", () => {
    withEnvironment(
      {
        TAGS__0: undefined,
      },
      () => {
        const environment = Environment.accumulate({
          tags: [],
        });

        expect(environment.tags).toEqual([]);
      }
    );
  });

  it("reads primitive array overrides on property access", () => {
    withEnvironment(
      {
        TAGS__0: "alpha",
        TAGS__1: "beta",
      },
      () => {
        const environment = Environment.accumulate({
          tags: ["fallback"],
        });

        expect(environment.tags).toEqual(["alpha", "beta"]);

        process.env.TAGS__0 = "updated";
        process.env.TAGS__1 = "gamma";

        expect(environment.tags).toEqual(["updated", "gamma"]);
      }
    );
  });

  it("parses primitive array entries heuristically when no sample element is provided", () => {
    withEnvironment(
      {
        ITEMS__0: "true",
        ITEMS__1: "42",
        ITEMS__2: "alpha",
      },
      () => {
        const environment = Environment.accumulate({
          items: [],
        });

        expect(environment.items).toEqual([true, 42, "alpha"]);
      }
    );
  });

  it("materializes object array elements without requiring a sample element", () => {
    withEnvironment(
      {
        SERVERS__0__HOST: "api",
        SERVERS__0__PORT: "3000",
        SERVERS__0__UNKNOWN: "allowed",
        SERVERS__2__HOST: "web",
      },
      () => {
        const environment = Environment.accumulate({
          servers: [],
        });

        expect(environment.servers).toEqual([
          {
            host: "api",
            port: 3000,
            unknown: "allowed",
          },
          ,
          {
            host: "web",
          },
        ]);
      }
    );
  });

  it("preserves sparse array indices", () => {
    withEnvironment(
      {
        TAGS__2: "tail",
      },
      () => {
        const environment = Environment.accumulate({
          tags: [],
        });

        expect(environment.tags).toHaveLength(3);
        expect(environment.tags[0]).toBeUndefined();
        expect(environment.tags[1]).toBeUndefined();
        expect(environment.tags[2]).toBe("tail");
      }
    );
  });

  it("throws INVALID ENVIRONMENT VARIABLE for invalid primitive array values", () => {
    withEnvironment(
      {
        PORTS__0: "not-a-number",
      },
      () => {
        const environment = Environment.accumulate({
          ports: [0],
        });

        let error: unknown;

        try {
          void environment.ports;
        } catch (caughtError) {
          error = caughtError;
        }

        expect(error).toBeInstanceOf(Error);

        const typedError = error as Error;

        expect(typedError.name).toBe("INVALID ENVIRONMENT VARIABLE");
        expect(typedError.message).toContain("PORTS__0");
        expect(typedError.message).toContain("number");
      }
    );
  });

  it("throws INVALID ENVIRONMENT VARIABLE when a primitive array receives nested indexed input", () => {
    withEnvironment(
      {
        PORTS__0__VALUE: "1",
      },
      () => {
        const environment = Environment.accumulate({
          ports: [0],
        });

        let error: unknown;

        try {
          void environment.ports;
        } catch (caughtError) {
          error = caughtError;
        }

        expect(error).toBeInstanceOf(Error);

        const typedError = error as Error;

        expect(typedError.name).toBe("INVALID ENVIRONMENT VARIABLE");
        expect(typedError.message).toContain("PORTS__0__VALUE");
      }
    );
  });

  it("supports object array entries while allowing undeclared child keys", () => {
    withEnvironment(
      {
        SERVERS__0__HOST: "api",
        SERVERS__0__PORT: "3000",
        SERVERS__0__UNKNOWN: "custom",
      },
      () => {
        const environment = Environment.accumulate({
          servers: [],
        });

        expect(environment.servers[0]).toEqual({
          host: "api",
          port: 3000,
          unknown: "custom",
        });
      }
    );
  });

  it("throws INVALID ENVIRONMENT VARIABLE when an object array entry collapses to a leaf value", () => {
    withEnvironment(
      {
        SERVERS__0: "api",
      },
      () => {
        const environment = Environment.accumulate({
          servers: [
            {
              host: "localhost",
              port: 3000,
            },
          ],
        });

        let error: unknown;

        try {
          void environment.servers;
        } catch (caughtError) {
          error = caughtError;
        }

        expect(error).toBeInstanceOf(Error);

        const typedError = error as Error;

        expect(typedError.name).toBe("INVALID ENVIRONMENT VARIABLE");
        expect(typedError.message).toContain("SERVERS__0");
      }
    );
  });

  it("allows overriding scalar, object, and array properties", () => {
    withEnvironment({}, () => {
      const environment = Environment.accumulate({
        mode: "test",
        nested: {
          id: 1,
          token: "token",
          active: true,
        },
        tags: ["alpha"],
      });

      environment.mode = "override";
      environment.nested = {
        id: 9,
        token: "patched",
        active: false,
      };
      environment.tags = ["custom"];

      expect(environment.mode).toBe("override");
      expect(environment.nested.id).toBe(9);
      expect(environment.nested.token).toBe("patched");
      expect(environment.nested.active).toBe(false);
      expect(environment.tags).toEqual(["custom"]);
    });
  });

  it("rejects unsafe object keys to avoid prototype pollution", () => {
    const environmentObject = Object.create(null) as {
      __proto__: string;
    };

    environmentObject.__proto__ = "unsafe";

    expect(() => Environment.accumulate(environmentObject)).toThrow(
      /not allowed/
    );
  });

  it("does not partially mutate the accumulator when unsafe keys are rejected", () => {
    const environment = Environment.accumulate({
      mode: "test",
    });

    const beforeKeys = Object.keys(environment);

    const unsafe = Object.create(null) as {
      __proto__: string;
    };

    unsafe.__proto__ = "unsafe";

    expect(() => Environment.accumulate(unsafe)).toThrow(/not allowed/);
    expect(Object.keys(environment)).toEqual(beforeKeys);
    expect(environment.mode).toBe("test");
  });
});
