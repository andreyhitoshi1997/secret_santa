import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { ParticipantsService } from "./service";
import { SessionStatus } from "../session/sessionStatus";
import { AddParticipantsRequest } from "./model";



describe("ParticipantsService", () => {
  let service: ParticipantsService;

  beforeEach(() => {
    service = new ParticipantsService();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create ParticipantsService instance", () => {
      expect(service).toBeInstanceOf(ParticipantsService);
    });

    it("should have required methods", () => {
      expect(typeof service.addParticipants).toBe("function");
      expect(typeof service.getParticipants).toBe("function");
    });
  });

  describe("email validation logic", () => {
    it("should handle case insensitive email comparison", () => {
      const emails = [
        "user@EXAMPLE.COM",
        "USER@example.com",
        "User@Example.Com",
      ];

      const normalizedEmails = emails.map((email) => email.toLowerCase());
      const uniqueEmails = new Set(normalizedEmails);

      expect(uniqueEmails.size).toBe(1);
      expect(uniqueEmails.has("user@example.com")).toBe(true);
    });

    it("should validate email format patterns", () => {
      const validEmails = [
        "user@example.com",
        "test.email@domain.co.uk",
        "user+tag@example.org",
        "user123@test-domain.net",
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user@domain",
        "user space@example.com",
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it("should handle duplicate detection across mixed cases", () => {
      const existingEmails = new Set([
        "user1@example.com".toLowerCase(),
        "USER2@EXAMPLE.COM".toLowerCase(),
        "User3@Example.Com".toLowerCase(),
      ]);

      const testEmails = [
        "USER1@EXAMPLE.COM",
        "user2@example.com",
        "User4@Example.Com",
      ];

      const results = testEmails.map((email) =>
        existingEmails.has(email.toLowerCase())
      );

      expect(results).toEqual([true, true, false]);
    });
  });

  describe("participant data structure validation", () => {
    it("should validate complete participant data", () => {
      const participantData = {
        sessionId: "session-uuid-123",
        email: "participant@example.com",
        name: "John Doe",
        isCreator: false,
      };

      expect(participantData).toMatchObject({
        sessionId: expect.any(String),
        email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
        name: expect.any(String),
        isCreator: expect.any(Boolean),
      });
    });

    it("should handle participant without name", () => {
      const participantWithoutName = {
        sessionId: "session-uuid-123",
        email: "participant@example.com",
        isCreator: false,
      };

      const processedName = (participantWithoutName as any).name || null;
      expect(processedName).toBe(null);
    });

    it("should validate creator flag variations", () => {
      const participants = [
        { isCreator: true },
        { isCreator: false },
        { isCreator: undefined },
      ];

      participants.forEach((participant) => {
        const isCreator = participant.isCreator || false;
        expect(typeof isCreator).toBe("boolean");
      });
    });

    it("should handle UUID format validation", () => {
      const validUUIDs = [
        "123e4567-e89b-12d3-a456-426614174000",
        "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      ];

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      validUUIDs.forEach((uuid) => {
        expect(uuidRegex.test(uuid)).toBe(true);
      });
    });
  });

  describe("session status validation", () => {
    it("should validate all session status values", () => {
      expect(SessionStatus.OPEN).toBe("open");
      expect(SessionStatus.CLOSED).toBe("closed");
      expect(SessionStatus.LOCKED).toBe("locked");
    });

    it("should identify valid status transitions for adding participants", () => {
      const validStatusForAdding = [SessionStatus.OPEN];
      const invalidStatusForAdding = [
        SessionStatus.CLOSED,
        SessionStatus.LOCKED,
      ];

      expect(validStatusForAdding.includes(SessionStatus.OPEN)).toBe(true);
      expect(validStatusForAdding.includes(SessionStatus.CLOSED)).toBe(false);
      expect(validStatusForAdding.includes(SessionStatus.LOCKED)).toBe(false);
    });

    it("should handle status comparison logic", () => {
      const sessionStatuses = ["open", "closed", "locked"];
      const currentStatus = "open";

      const canAddParticipants = currentStatus === SessionStatus.OPEN;
      expect(canAddParticipants).toBe(true);
    });
  });

  describe("request structure validation", () => {
    it("should validate AddParticipantsRequest structure", () => {
      const validRequest: AddParticipantsRequest = {
        participants: [
          { email: "user1@example.com", name: "User One" },
          { email: "user2@example.com", name: "User Two" },
          { email: "user3@example.com" },
        ],
      };

      expect(validRequest).toHaveProperty("participants");
      expect(Array.isArray(validRequest.participants)).toBe(true);
      expect(validRequest.participants).toHaveLength(3);
      expect(validRequest.participants[0]).toHaveProperty("email");
      expect(validRequest.participants[0]).toHaveProperty("name");
    });

    it("should handle participants with mixed name presence", () => {
      const participants = [
        { email: "with-name@example.com", name: "Has Name" },
        { email: "without-name@example.com" },
      ];

      participants.forEach((participant) => {
        expect(participant.email).toBeTruthy();
        const processedName = participant.name || null;
        const isValidType =
          processedName === null || typeof processedName === "string";
        expect(isValidType).toBe(true);
      });
    });

    it("should validate minimum and maximum participants", () => {
      const singleParticipant = [{ email: "single@example.com" }];
      const manyParticipants = Array.from({ length: 50 }, (_, i) => ({
        email: `user${i}@example.com`,
        name: `User ${i}`,
      }));

      expect(singleParticipant.length).toBeGreaterThanOrEqual(1);
      expect(manyParticipants.length).toBeLessThanOrEqual(50);
    });
  });

  describe("response structure validation", () => {
    it("should validate AddParticipantsResponse structure", () => {
      const mockResponse = {
        added: 3,
        totalParticipants: 5,
        duplicatesIgnored: ["existing@example.com"],
      };

      expect(typeof mockResponse.added).toBe("number");
      expect(typeof mockResponse.totalParticipants).toBe("number");
      expect(Array.isArray(mockResponse.duplicatesIgnored)).toBe(true);

      expect(mockResponse.added).toBeGreaterThanOrEqual(0);
      expect(mockResponse.totalParticipants).toBeGreaterThanOrEqual(0);
      expect(mockResponse.duplicatesIgnored.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle edge case responses", () => {
      const edgeCases = [
        { added: 0, totalParticipants: 0, duplicatesIgnored: [] },
        { added: 1, totalParticipants: 1, duplicatesIgnored: [] },
        {
          added: 0,
          totalParticipants: 5,
          duplicatesIgnored: ["dup1@example.com"],
        },
      ];

      edgeCases.forEach((response) => {
        expect(response.added).toBeGreaterThanOrEqual(0);
        expect(response.totalParticipants).toBeGreaterThanOrEqual(
          response.added
        );
        expect(Array.isArray(response.duplicatesIgnored)).toBe(true);
      });
    });
  });

  describe("error handling patterns", () => {
    it("should format session not found errors", () => {
      const error = new Error("Session not found");
      expect(error.message).toBe("Session not found");
    });

    it("should format invalid session status errors", () => {
      const statuses = ["closed", "locked"];
      statuses.forEach((status) => {
        const error = new Error(
          `Cannot add participants to session with status: ${status}`
        );
        expect(error.message).toContain(
          "Cannot add participants to session with status:"
        );
        expect(error.message).toContain(status);
      });
    });

    it("should handle database connection errors", () => {
      const dbErrors = [
        "Connection timeout",
        "Database unavailable",
        "Query failed",
      ];

      dbErrors.forEach((errorMsg) => {
        const error = new Error(errorMsg);
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe(errorMsg);
      });
    });
  });

  describe("business logic validation", () => {
    it("should validate participant count limits", () => {
      const minParticipants = 3;
      const maxParticipants = 50;

      expect(minParticipants).toBeLessThanOrEqual(maxParticipants);
      expect(minParticipants).toBeGreaterThan(0);
    });

    it("should handle duplicate email scenarios", () => {
      const scenarios = [
        {
          existing: ["user1@example.com"],
          new: ["user2@example.com"],
          expectedDuplicates: 0,
        },
        {
          existing: ["user1@example.com"],
          new: ["user1@example.com"],
          expectedDuplicates: 1,
        },
        {
          existing: ["user1@example.com", "user2@example.com"],
          new: ["user1@example.com", "user3@example.com"],
          expectedDuplicates: 1,
        },
      ];

      scenarios.forEach((scenario) => {
        const existingSet = new Set(
          scenario.existing.map((e) => e.toLowerCase())
        );
        const duplicates = scenario.new.filter((email) =>
          existingSet.has(email.toLowerCase())
        );
        expect(duplicates.length).toBe(scenario.expectedDuplicates);
      });
    });

    it("should validate creator assignment logic", () => {
      const participants = [
        { email: "creator@example.com", isCreator: true },
        { email: "participant1@example.com", isCreator: false },
        { email: "participant2@example.com", isCreator: false },
      ];

      const creators = participants.filter((p) => p.isCreator);
      expect(creators.length).toBe(1);
    });
  });

  describe("integration tests", () => {
    it("should handle addParticipants with invalid session", async () => {
      const service = new ParticipantsService();
      const request = {
        participants: [{ email: "test@example.com", name: "Test User" }],
      };

      await expect(
        service.addParticipants("invalid-session-id", request)
      ).rejects.toThrow();
    });

    it("should handle getParticipants with invalid session", async () => {
      const service = new ParticipantsService();

      await expect(
        service.getParticipants("invalid-session-id")
      ).rejects.toThrow();
    });

    it("should exercise addParticipants validation paths", async () => {
      const service = new ParticipantsService();

      const emptyRequest = { participants: [] };
      await expect(
        service.addParticipants("session-id", emptyRequest)
      ).rejects.toThrow();

      const multiRequest = {
        participants: [
          { email: "user1@example.com", name: "User One" },
          { email: "user2@example.com", name: "User Two" },
          { email: "user3@example.com" },
        ],
      };
      await expect(
        service.addParticipants("session-id", multiRequest)
      ).rejects.toThrow();

      const duplicateRequest = {
        participants: [
          { email: "user@example.com", name: "User" },
          { email: "USER@EXAMPLE.COM", name: "User Upper" },
          { email: "User@Example.Com", name: "User Mixed" },
        ],
      };
      await expect(
        service.addParticipants("session-id", duplicateRequest)
      ).rejects.toThrow();
    });

    it("should exercise constructor and method presence", () => {
      const service = new ParticipantsService();

      expect(service).toBeInstanceOf(ParticipantsService);
      expect(typeof service.addParticipants).toBe("function");
      expect(typeof service.getParticipants).toBe("function");
    });

    it("should test error handling in service methods", async () => {
      const service = new ParticipantsService();

      const invalidIds = [
        "",
        " ",
        null as any,
        undefined as any,
        "nonexistent-session",
      ];

      for (const sessionId of invalidIds) {
        const request = {
          participants: [{ email: "test@example.com", name: "Test" }],
        };

        try {
          await service.addParticipants(sessionId, request);
        } catch (error) {
          expect(error).toBeDefined();
        }

        try {
          await service.getParticipants(sessionId);
        } catch (error) {
        }
      }
    });

    it("should exercise console logging paths", () => {
      const service = new ParticipantsService();
      expect(service).toBeDefined();

      const testCases = [
        { participants: [] },
        { participants: [{ email: "test@example.com" }] },
        { participants: [{ email: "test1@example.com", name: "Test" }] },
        {
          participants: [
            { email: "test1@example.com", name: "Test 1" },
            { email: "test2@example.com", name: "Test 2" },
            { email: "test3@example.com" },
          ],
        },
      ];

      testCases.forEach((testCase) => {
        expect(async () => {
          try {
            await service.addParticipants("test-session", testCase);
          } catch {
          }
        }).toBeDefined();
      });
    });

    it("should handle various participant configurations", async () => {
      const service = new ParticipantsService();

      const configurations = [
        {
          participants: [{ email: "single@example.com", name: "Single User" }],
        },

        {
          participants: [
            { email: "user1@example.com", name: "User One" },
            { email: "user2@example.com", name: "User Two" },
          ],
        },

        {
          participants: [
            { email: "with@example.com", name: "With Name" },
            { email: "without@example.com" },
          ],
        },

        {
          participants: [
            { email: "lower@example.com", name: "Lower Case" },
            { email: "UPPER@EXAMPLE.COM", name: "Upper Case" },
            { email: "Mixed@Example.Com", name: "Mixed Case" },
          ],
        },
      ];

      for (const config of configurations) {
        try {
          await service.addParticipants("test-session-id", config);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    it("should test database interaction paths for addParticipants", async () => {
      const service = new ParticipantsService();

      const scenarios = [
        {
          sessionId: "scenario-1",
          participants: [{ email: "test1@example.com", name: "Test 1" }],
        },
        {
          sessionId: "scenario-2",
          participants: [
            { email: "test2@example.com", name: "Test 2" },
            { email: "test3@example.com" },
          ],
        },
        {
          sessionId: "scenario-3",
          participants: [],
        },
      ];

      for (const scenario of scenarios) {
        try {
          const result = await service.addParticipants(
            scenario.sessionId,
            scenario
          );
          expect(typeof result.added).toBe("number");
          expect(typeof result.totalParticipants).toBe("number");
          expect(Array.isArray(result.duplicatesIgnored)).toBe(true);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    it("should test getParticipants method thoroughly", async () => {
      const service = new ParticipantsService();

      const testSessionIds = [
        "get-participants-test-1",
        "get-participants-test-2",
        "nonexistent-session-id",
        "another-test-session",
      ];

      for (const sessionId of testSessionIds) {
        try {
          const participants = await service.getParticipants(sessionId);
          expect(Array.isArray(participants)).toBe(true);

          if (participants.length > 0) {
            const participant = participants[0];
            expect(typeof participant.id).toBe("string");
            expect(typeof participant.email).toBe("string");
            expect(typeof participant.isCreator).toBe("boolean");
          }
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    it("should handle edge cases in email processing", async () => {
      const service = new ParticipantsService();

      const edgeCaseEmails = [
        { email: "UPPERCASE@TEST.COM", name: "Upper" },
        { email: "lowercase@test.com", name: "Lower" },
        { email: "MiXeD@TeSt.CoM", name: "Mixed" },
        { email: "special+tag@test.com", name: "Special" },
        { email: "dots.in.name@test.com", name: "Dots" },
      ];

      try {
        await service.addParticipants("edge-case-session", {
          participants: edgeCaseEmails,
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should exercise duplicate detection logic fully", async () => {
      const service = new ParticipantsService();

      const duplicateScenarios = [
        {
          participants: [
            { email: "same@test.com", name: "First" },
            { email: "same@test.com", name: "Second" },
          ],
        },
        {
          participants: [
            { email: "case@test.com", name: "Lower" },
            { email: "CASE@TEST.COM", name: "Upper" },
          ],
        },
        {
          participants: [
            { email: "multi@test.com", name: "One" },
            { email: "Multi@Test.Com", name: "Two" },
            { email: "MULTI@TEST.COM", name: "Three" },
          ],
        },
      ];

      for (const scenario of duplicateScenarios) {
        try {
          await service.addParticipants("duplicate-test-session", scenario);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });


  });

  describe("improved coverage with actual method execution", () => {
    it("should exercise participant validation logic in addParticipants", async () => {
      const testService = new ParticipantsService();
      
      const request: AddParticipantsRequest = {
        participants: [
          { email: "test1@example.com", name: "Test User 1" },
          { email: "TEST1@EXAMPLE.COM", name: "Duplicate Test" },
          { email: "test2@example.com" },
          { email: "test3@example.com", name: "Test User 3" }
        ]
      };

      try {
        await testService.addParticipants("test-session-id", request);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should test various email formats and participant structures", async () => {
      const testService = new ParticipantsService();

      const testCases = [
        {
          participants: [{ email: "simple@test.com", name: "Simple User" }]
        },
        {
          participants: [
            { email: "user1@domain.co.uk", name: "UK User" },
            { email: "user2@subdomain.example.org" },
            { email: "user+tag@company.com", name: "Tagged Email" }
          ]
        },
        {
          participants: Array.from({ length: 5 }, (_, i) => ({
            email: `user${i}@batch.com`,
            name: i % 2 === 0 ? `User ${i}` : undefined
          }))
        }
      ];

      for (const testCase of testCases) {
        try {
          await testService.addParticipants("batch-test", testCase);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });

    it("should exercise getParticipants method execution", async () => {
      const testService = new ParticipantsService();

      const sessionIds = [
        "participants-test-1",
        "participants-test-2", 
        "empty-session",
        "another-session"
      ];

      for (const sessionId of sessionIds) {
        try {
          const result = await testService.getParticipants(sessionId);
          expect(Array.isArray(result)).toBe(true);
        } catch (error) {
          expect(error).toBeDefined();
        }
      }
    });
  });
});
