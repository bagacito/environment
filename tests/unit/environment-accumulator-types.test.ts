import { Environment } from "../../src";

type EnvironmentConfig = {
  mode: string;
  nested: {
    id: number;
    token: string;
    active: boolean;
  };
  someVar: string;
  tags: string[];
  servers: {
    host: string;
    port: number;
  }[];
};

type Assert<T extends true> = T;
type IsNever<T> = [T] extends [never] ? true : false;

const defaultConfig: EnvironmentConfig = {
  mode: "maintenance",
  nested: {
    id: 1,
    token: "secret",
    active: true,
  },
  someVar: "value",
  tags: ["alpha", "beta"],
  servers: [
    {
      host: "localhost",
      port: 3000,
    },
  ],
};

const environment = Environment.accumulate(defaultConfig);

type EnvironmentIsNotNever = Assert<
  IsNever<typeof environment> extends true ? false : true
>;

const mode: string = environment.mode;
const nestedId: number = environment.nested.id;
const nestedToken: string = environment.nested.token;
const nestedActive: boolean = environment.nested.active;
const someVar: string = environment.someVar;
const tags: string[] = environment.tags;
const serverHost: string = environment.servers[0].host;
const serverPort: number = environment.servers[0].port;
const chained = environment.accumulate({
  region: "eu-west-1",
  retries: 3,
  enabled: false,
});

describe("Environment accumulator type inference", () => {
  it("preserves nested accumulated config fields and accumulator methods", () => {
    expect(environment.mode).toBe("maintenance");
    expect(environment.nested.id).toBe(1);
    expect(environment.nested.token).toBe("secret");
    expect(environment.nested.active).toBe(true);
    expect(environment.someVar).toBe("value");
    expect(environment.tags).toEqual(["alpha", "beta"]);
    expect(environment.servers[0].host).toBe("localhost");
    expect(environment.servers[0].port).toBe(3000);
    expect(mode).toBe("maintenance");
    expect(nestedId).toBe(1);
    expect(nestedToken).toBe("secret");
    expect(nestedActive).toBe(true);
    expect(someVar).toBe("value");
    expect(tags).toEqual(["alpha", "beta"]);
    expect(serverHost).toBe("localhost");
    expect(serverPort).toBe(3000);
    expect(chained.region).toBe("eu-west-1");
    expect(chained.retries).toBe(3);
    expect(chained.enabled).toBe(false);
    expect(typeof chained.accumulate).toBe("function");
  });
});
