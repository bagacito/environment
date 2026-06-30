import { Environment } from "../../src"

function withEnvironment(
  entries: Record<string, string | undefined>,
  run: () => void,
): void {
  const previous = new Map<string, string | undefined>()

  for (const [key, value] of Object.entries(entries)) {
    previous.set(key, process.env[key])
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  try {
    run()
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

describe("Environment accumulator behavior", () => {
  it("returns default values when uppercase environment variables are missing", () => {
    withEnvironment(
      {
        MODE: undefined,
        AGE: undefined,
        NAME: undefined,
        ACTIVE: undefined,
      },
      () => {
        const environment = Environment.accumulate({
          mode: "test",
          age: 21,
          name: "alice",
          active: false,
        })

        expect(environment.mode).toBe("test")
        expect(environment.age).toBe(21)
        expect(environment.name).toBe("alice")
        expect(environment.active).toBe(false)
      },
    )
  })

  it("reads environment overrides on property access", () => {
    withEnvironment({ MODE: "prod", ACTIVE: "false" }, () => {
      const environment = Environment.accumulate({
        mode: "test",
        active: true,
      })

      expect(environment.mode).toBe("prod")
      expect(environment.active).toBe(false)

      process.env.MODE = "staging"
      process.env.ACTIVE = "true"

      expect(environment.mode).toBe("staging")
      expect(environment.active).toBe(true)
    })
  })

  it("parses strings, booleans, and numbers from uppercase environment variables", () => {
    withEnvironment(
      {
        AGE: "42",
        NAME: "Morgan",
        ACTIVE: "true",
      },
      () => {
        const environment = Environment.accumulate({
          age: 18,
          name: "alice",
          active: false,
        })

        expect(environment.age).toBe(42)
        expect(environment.name).toBe("Morgan")
        expect(environment.active).toBe(true)
      },
    )
  })

  it("throws INVALID ENVIRONMENT VARIABLE for invalid parsed values", () => {
    withEnvironment({ AGE: "not-a-number" }, () => {
      const environment = Environment.accumulate({
        age: 18,
      })

      let error: unknown

      try {
        void environment.age
      } catch (caughtError) {
        error = caughtError
      }

      expect(error).toBeInstanceOf(Error)

      const typedError = error as Error

      expect(typedError.name).toBe("INVALID ENVIRONMENT VARIABLE")
      expect(typedError.message).toContain("AGE")
      expect(typedError.message).toContain("number")
      expect(typedError.message).toContain("string")
    })
  })

  it("rejects unsafe object keys to avoid prototype pollution", () => {
    const environmentObject = Object.create(null) as {
      __proto__: string
    }

    environmentObject.__proto__ = "unsafe"

    expect(() => Environment.accumulate(environmentObject)).toThrow(
      /not allowed/,
    )
  })

  it("does not partially mutate the accumulator when unsafe keys are rejected", () => {
    const environment = Environment.accumulate({
      mode: "test",
    })

    const beforeKeys = Object.keys(environment)

    const unsafe = Object.create(null) as {
      __proto__: string
    }

    unsafe.__proto__ = "unsafe"

    expect(() => Environment.accumulate(unsafe)).toThrow(/not allowed/)
    expect(Object.keys(environment)).toEqual(beforeKeys)
    expect(environment.mode).toBe("test")
  })
})
