const { filterResults } = require("./filter");

describe("filterResults", function () {
    const compResults = [
        {
            name: "C1",
            handle: "c1",
            numEmployees: 2
        },
        {
            name: "C2",
            handle: "c2",
            numEmployees: 4
        },
        {
            name: "C3",
            handle: "c3",
            numEmployees: 6
        }
    ];
    const jobResults = [
        {
            title: "J1",
            companyHandle: "c1",
            salary: 20000,
            equity: null
        },
        {
            title: "J2",
            companyHandle: "c2",
            salary: 40000,
            equity: 0.04
        },
        {
            title: "J3",
            companyHandle: "c3",
            salary: 60000,
            equity: 0.06
        }
    ];

    const compFilters1 = {
        nameLike: "1"
    };
    const compFilters2 = {
        maxEmployees: 4
    };

    const jobFilters1 = {
        hasEquity: true
    };

    const jobFilters2 = {
        title: "1",
        minSalary: 35000
    }

    const fakeFilters = {
        hours: 14
    }

    test("works given a few results and a filter", function () {
        let results = filterResults(compResults, compFilters1);
        expect(results).toEqual([
            {
                name: "C1",
                handle: "c1",
                numEmployees: 2
            }
        ]);

        results = filterResults(compResults, compFilters2);
        expect(results).toEqual([
            {
                name: "C1",
                handle: "c1",
                numEmployees: 2
            },
            {
                name: "C2",
                handle: "c2",
                numEmployees: 4
            }
        ]);

        results = filterResults(jobResults, jobFilters1);
        expect(results).toEqual([
            {
                title: "J2",
                companyHandle: "c2",
                salary: 40000,
                equity: 0.04
            },
            {
                title: "J3",
                companyHandle: "c3",
                salary: 60000,
                equity: 0.06
            }
        ]);

        results = filterResults(jobResults, jobFilters2);
        expect(results).toEqual([]);
    });

    test("unchanged for no filters", function () {
        const results = filterResults(jobResults, {});
        expect(results).toEqual(jobResults);
    });

    test("unchanged for unrecognized filters", function () {
        const results = filterResults(jobResults, fakeFilters);
        expect(results).toEqual(jobResults);
    })
});