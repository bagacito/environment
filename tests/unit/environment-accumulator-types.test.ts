import { Environment } from "../../src";

type EnvironmentConfig = {
  mode: string;
  active: boolean;
  sequence: number;
};

type Assert<T extends true> = T;
type IsNever<T> = [T] extends [never] ? true : false;

const defaultConfig: EnvironmentConfig = {
  mode: "maintenance",
  active: true,
  sequence: 1,
};

const environment = Environment.accumulate(defaultConfig);

type EnvironmentIsNotNever = Assert<
  IsNever<typeof environment> extends true ? false : true
>;
const mode: string = environment.mode;
const active: boolean = environment.active;
const sequence: number = environment.sequence;
const chained = environment.accumulate({
  region: "eu-west-1",
  retries: 3,
  enabled: false,
});

describe("Environment accumulator type inference", () => {
  it("preserves accumulated config fields and accumulator methods", () => {
    expect(environment.mode).toBe("maintenance");
    expect(mode).toBe("maintenance");
    expect(active).toBe(true);
    expect(sequence).toBe(1);
    expect(chained.region).toBe("eu-west-1");
    expect(chained.retries).toBe(3);
    expect(chained.enabled).toBe(false);
    expect(typeof chained.accumulate).toBe("function");
  });
});
