import { describe, it, expect, afterEach } from "vitest";
import { guardTestUri } from "../tests/helpers/integration";

describe("guardTestUri", () => {
  const setUri = (host: string, db: string) => {
    process.env.MONGODB_URI = `mongodb+srv://user:secret@${host}/${db}`;
  };

  it("blocks the production database outright", () => {
    setUri("projects.pfyfg80.mongodb.net", "chrono");
    expect(() => guardTestUri()).toThrowError(/SAFETY GUARD/);
  });

  it("blocks the production host even with a chrono-named database", () => {
    setUri("projects.pfyfg80.mongodb.net", "chrono");
    expect(() => guardTestUri()).toThrowError(/SAFETY GUARD/);
  });

  it("allows local throwaway databases", () => {
    setUri("127.0.0.1", "chrono_test");
    expect(() => guardTestUri()).not.toThrow();
  });

  it("allows a dedicated test database even on a shared cluster", () => {
    setUri("projects.pfyfg80.mongodb.net", "chrono_test");
    expect(() => guardTestUri()).not.toThrow();
  });

  afterEach(() => {
    delete process.env.MONGODB_URI;
  });
});
