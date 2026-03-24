module.exports = function(eleventyConfig) {
    // Passthrough copy
    eleventyConfig.addPassthroughCopy("src/css");
    eleventyConfig.addPassthroughCopy("src/js");
    eleventyConfig.addPassthroughCopy("src/assets");
    eleventyConfig.addPassthroughCopy("src/admin");

    // Collections
    eleventyConfig.addCollection("actualites", function(collectionApi) {
        return collectionApi.getFilteredByTag("actualite").sort((a, b) => b.date - a.date);
    });

    eleventyConfig.addCollection("temoignages", function(collectionApi) {
        return collectionApi.getFilteredByTag("temoignage");
    });

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            data: "_data"
        },
        templateFormats: ["njk", "md"],
        htmlTemplateEngine: "njk",
        markdownTemplateEngine: "njk"
    };
};
