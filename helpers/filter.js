/** Filtering function to for companies and jobs.
 *  
 * Allows for an object that does not match any filters to pass unchanged.
 * Allows for east addition of new filters later.
 * 
 * Note: nomenclature in filter function indicates usage.
 * ie. results.filter(comp => ...) is a filter used for companies
 *     results.filter(job => ...) is a filter used for jobs
 */

function filterResults(results, filters) {
    results = filters.minEmployees ?
        results.filter(comp => comp.numEmployees >= filters.minEmployees) :
        results;

    results = filters.maxEmployees ?
        results.filter(comp => comp.numEmployees <= filters.maxEmployees) :
        results;

    results = filters.nameLike ?
        results.filter(comp => comp.name.toLowerCase().includes(filters.nameLike)) :
        results;

    results = filters.title ?
        results.filter(job => job.title.toLowerCase().includes(filters.title)) :
        results;

    results = filters.minSalary ?
        results.filter(job => job.salary >= filters.minSalary) :
        results;

    results = filters.hasEquity ?
        results.filter(job => (job.equity && job.equity > 0)) :
        results;

    return results;
}

module.exports = { filterResults };