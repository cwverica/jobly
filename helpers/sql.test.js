const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
    test("works: given a few columns", function () {
        const testData = {
            firstName: "Johnny",
            lastName: "Rose",
            ageInYears: 58
        };
        const conversionMap = {
            ageInYears: "age_in_years"
        };

        const returned = sqlForPartialUpdate(testData, conversionMap);

        expect(returned).toEqual({
            setCols: '"firstName"=$1, "lastName"=$2, "age_in_years"=$3',
            values: ['Johnny', 'Rose', 58]
        });
    });

    test("throws error when given no data", function () {
        const testData = {};
        const conversionMap = {};
        const thrown = () => { sqlForPartialUpdate(testData, conversionMap) };

        expect(thrown).toThrow(BadRequestError);
        expect(thrown).toThrow("No data");
    });
});