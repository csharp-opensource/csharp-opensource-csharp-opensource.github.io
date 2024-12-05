const fs = require('fs');
const config = require('./config.json');

let headers = {
    'Authorization': process.env.GITHUB_TOKEN,
};

async function getRepo(url) {
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error("Failed to fetch repositories");
        let repo = await response.json();
        try {
            const contributorsResponse = await fetch(repo.contributors_url);
            if (!contributorsResponse.ok) throw new Error("Failed to fetch contributors");
            repo.contributorsList = await contributorsResponse.json();
        }  catch (error) {
            console.error(`Error fetching contributors ${url}`, error);
            repo.contributorsList = [];
        }
        return repo;
    } catch (error) {
        console.error(`Error fetching repository ${url}`, error);
        return null;
    }
}

async function fetchRepositories() {
    try {
        const reposPromises = fetchConfigs.map(({ orgOrUser, isUser }) =>
            getRepo(`https://api.github.com/${isUser ? "users" : "orgs"}/${orgOrUser}/repos?sort=pushed`)
        );
        const allRepos = (await Promise.all(reposPromises))
            .flat()
            .filter(repo => repo); // Remove any null or undefined results
        allRepos.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
    } catch (error) {
        console.error("Error fetching repositories:", error);
    }
}

async function modifyHTML() {
    let repos = await fetchRepositories();
    repos = repos.filter(x => x);
    const indexContent = fs.readFileSync('./index.html', 'utf-8');
    indexContent = indexContent.replace(`SET_TITLE`, config.title);
    indexContent = indexContent.replace(`SET_REPO_JSON`, JSON.stringify(repos, undefined, 4));
    fs.writeFileSync('./_site/index.html', indexContent);
    console.log('index.html generated successfully!');
} 



modifyHTML();
