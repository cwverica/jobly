const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "NJ1",
        salary: 50000,
        equity: 0.45,
        companyHandle: "c3"
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            ...newJob,
            equity: "0.45",
            id: expect.any(Number)
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE title = 'NJ1'`);
        expect(result.rows).toEqual([
            {
                id: expect.any(Number),
                title: "NJ1",
                salary: 50000,
                equity: "0.45",
                companyHandle: "c3"
            },
        ]);
    });

    test("bad request with dupe", async function () {
        try {
            await Job.create(newJob);
            await Job.create(newJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                title: "J1",
                salary: 100000,
                equity: null,
                companyHandle: "c2",
                id: expect.any(Number)
            },
            {
                title: "J2",
                salary: 70000,
                equity: "0.04",
                companyHandle: "c1",
                id: expect.any(Number)
            }
        ]);
    });

    test("Works: filter minSalary = 75000 ", async function () {
        let jobs = await Job.findAll({ minSalary: 75000 })
        expect(jobs).toEqual([
            {
                title: "J1",
                salary: 100000,
                equity: null,
                companyHandle: "c2",
                id: expect.any(Number)
            }
        ])
    })
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        const result = await db.query(
            `SELECT id, title
            FROM jobs
            WHERE title = 'J1'`
        )
        const jobID = result.rows[0]['id'];
        let job = await Job.get(jobID);
        expect(job).toEqual({
            title: "J1",
            salary: 100000,
            equity: null,
            company: {
                handle: "c2",
                name: "C2",
                numEmployees: 2,
                description: "Desc2",
                logoUrl: "http://c2.img"
            },
            id: jobID
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get("0");
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "J1a",
        salary: 500,
        equity: .89
    };

    test("works", async function () {
        const jobResult = await db.query(
            `SELECT id
                FROM jobs
                WHERE title = 'J1'`
        );
        const jobID = jobResult.rows[0].id;
        let job = await Job.update(jobID, updateData);
        expect(job).toEqual({
            ...updateData,
            equity: "0.89",
            id: jobID,
            companyHandle: "c2"
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
             FROM jobs
             WHERE title = 'J1a'`);
        expect(result.rows).toEqual([{
            id: expect.any(Number),
            title: "J1a",
            salary: 500,
            equity: "0.89",
            company_handle: "c2"
        }]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: "J1a",
            salary: null,
            equity: null
        };

        const jobResult = await db.query(
            `SELECT id
                FROM jobs
                WHERE title = 'J1'`
        );
        const jobID = jobResult.rows[0].id;

        let job = await Job.update(jobID, updateDataSetNulls);
        expect(job).toEqual({
            ...updateDataSetNulls,
            id: jobID,
            companyHandle: "c2"
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
             FROM jobs
             WHERE id = $1`, [jobID]);
        expect(result.rows).toEqual([{
            id: jobID,
            title: "J1a",
            company_handle: "c2",
            salary: null,
            equity: null
        }]);
    });

    test("not found if no such job", async function () {
        try {
            await Job.update("0", updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            const result = await db.query(
                `SELECT id
                    FROM jobs
                    WHERE title = 'J1'`
            );
            const jobID = result.rows[0].id;
            await Job.update(jobID, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        const result = await db.query(
            `SELECT *
            FROM jobs
            WHERE title = 'J1'`
        );
        // console.log(result);
        const jobID = result.rows[0].id;
        await Job.remove(jobID);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id = $1", [jobID]);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove("0");
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

