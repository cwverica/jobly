"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, company_handle }
     *
     * Returns { id, title, salary, equity, company_handle }
     *
     * Throws BadRequestError if job already in database.
     * */

    static async create({ title, salary, equity, companyHandle }) {
        const duplicateCheck = await db.query(
            `SELECT title
                    FROM jobs
                    WHERE title=$1 AND company_handle=$2`,
            [title, companyHandle]);

        if (duplicateCheck.rows[0])
            throw new BadRequestError(`Duplicate job: ${title} at ${companyHandle}`);

        const result = await db.query(
            `INSERT INTO jobs
                        (title, salary, equity, company_handle)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                companyHandle
            ],
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     * 
     * Accepts an object with a list of filters as a parameter. Will filter the 
     * results based on provided filter properties.
     * 
     * Can be called without being passed an object, or it can be passed an empty
     *  object.
     *
     * Returns [{ id, title, salary, equity, companyHandle }, ...]
     * */

    static async findAll(filters) {
        const jobsRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`);

        let jobs = jobsRes.rows;

        if (filters) {
            jobs = filters.title ?
                jobs.filter(job => job.title.toLowerCase().includes(filters.title)) :
                jobs;

            jobs = filters.minSalary ?
                jobs.filter(job => job.salary >= filters.minSalary) :
                jobs;

            jobs = filters.hasEquity ?
                jobs.filter(job => (job.equity && job.equity > 0)) :
                jobs;
        }

        return jobs;
    }

    /** Given a job id, return data about the job.
     *
     * Returns { id, title, salary, equity, companyHandle }
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id, 
                    title, 
                    salary, 
                    equity, 
                    company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0] ? jobRes.rows[0] : null;

        if (!job) throw new NotFoundError(`No job: ${id}`); // TODO: Not throwing error

        return job;
    }

    /** Update company data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns { id, title, salary, equity, companyHandle }
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                companyHandle: "company_handle"
            });
        const handleVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id,
                                title,
                                salary,
                                equity,
                                company_handle AS "companyHandle"`
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job.id) throw new NotFoundError(`No job: ${id}`); //TODO: Not throwing error

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job.id) throw new NotFoundError(`No job: ${id}`); //TODO: Not throwing error
    }
}


module.exports = Job;
