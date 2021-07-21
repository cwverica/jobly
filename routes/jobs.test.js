"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    a1Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "NJ1",
        salary: 89999,
        equity: 0.12,
        companyHandle: "c1"
    };

    test("ok for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                ...newJob,
                equity: "0.12",
                id: expect.any(Number)
            }
        });
    });

    test("unauthorized for users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toBe(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                equity: 0.10,
                salary: 150
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                equity: 1.2
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
                [
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
                ]
        });
    });

    test("works with query name (partial match)", async function () {
        const resp = await request(app).get('/jobs?title=1');
        expect(resp.body).toEqual({
            jobs:
                [{
                    title: "J1",
                    salary: 100000,
                    equity: null,
                    companyHandle: "c2",
                    id: expect.any(Number)
                }]
        });
    });

    test("works with query name (partial match) alternate", async function () {
        const resp = await request(app).get('/jobs?title=j');
        expect(resp.body).toEqual({
            jobs:
                [{
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
                }]
        });
    });

    test("works with multiple query strings", async function () {
        const resp = await request(app).get('/jobs?title=j&minSalary=80000');
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        title: "J1",
                        salary: 100000,
                        equity: null,
                        companyHandle: "c2",
                        id: expect.any(Number)
                    }
                ]
        });
    });


    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const jobRes = await db.query(`
        SELECT id
        FROM jobs
        WHERE title=$1`,
            ["J2"]);
        const jobID = jobRes.rows[0].id
        const resp = await request(app).get(`/jobs/${jobID}`);
        expect(resp.body).toEqual({
            job: {
                title: "J2",
                salary: 70000,
                equity: "0.04",
                company:
                {
                    handle: "c1",
                    name: "C1",
                    numEmployees: 1,
                    description: "Desc1",
                    logoUrl: "http://c1.img"
                },
                id: expect.any(Number)
            }
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {

    test("works for admin", async function () {
        const jobRes = await db.query(`
        SELECT id
        FROM jobs
        WHERE title=$1`,
            ["J2"]);
        const jobID = jobRes.rows[0].id
        const resp = await request(app)
            .patch(`/jobs/${jobID}`)
            .send({ title: "J2-new" })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.body).toEqual({
            job: {
                title: "J2-new",
                salary: 70000,
                equity: "0.04",
                companyHandle: "c1",
                id: expect.any(Number)
            }
        });
    });


    test("unauth for users", async function () {
        const jobRes = await db.query(`
        SELECT id
        FROM jobs
        WHERE title=$1`,
            ["J2"]);
        const jobID = jobRes.rows[0].id
        const resp = await request(app)
            .patch(`/jobs/${jobID}`)
            .send({ title: "J2-new" })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toBe(401);
    });

    test("unauth for anon", async function () {
        const jobRes = await db.query(`
        SELECT id
        FROM jobs
        WHERE title=$1`,
            ["J2"]);
        const jobID = jobRes.rows[0].id
        const resp = await request(app)
            .patch(`/jobs/${jobID}`)
            .send({ title: "J2-new" });
        expect(resp.statusCode).toBe(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({ title: "new nope" })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(404);
    });


    test("bad request on invalid data", async function () {
        const jobRes = await db.query(`
        SELECT id
        FROM jobs
        WHERE title=$1`,
            ["J2"]);
        const jobID = jobRes.rows[0].id
        const resp = await request(app)
            .patch(`/jobs/${jobID}`)
            .send({ equity: 1.5 })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});



/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {

    test("works for admin", async function () {
        const jobRes = await db.query(`
        SELECT id
        FROM jobs
        WHERE title=$1`,
            ["J2"]);
        const jobID = jobRes.rows[0].id;
        const resp = await request(app)
            .delete(`/jobs/${jobID}`)
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.body).toEqual({ deleted: `${jobID}` });
    });

    test("unauth for users", async function () {
        const jobRes = await db.query(`
        SELECT id
        FROM jobs
        WHERE title=$1`,
            ["J2"]);
        const jobID = jobRes.rows[0].id;
        const resp = await request(app)
            .delete(`/jobs/${jobID}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toBe(401);
    });

    test("unauth for anon", async function () {
        const jobRes = await db.query(`
        SELECT id
        FROM jobs
        WHERE title=$1`,
            ["J2"]);
        const jobID = jobRes.rows[0].id;
        const resp = await request(app)
            .delete(`/jobs/${jobID}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});

