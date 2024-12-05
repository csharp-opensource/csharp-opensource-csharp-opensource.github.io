const fs = require('fs');
const config = require('./config.json');

let headers = {
    'Authorization': process.env.GITHUB_TOKEN,
};

async function fetchRepositories() {
    try {
        const reposPromises = fetchConfigs.map(({ orgOrUser, isUser }) =>
            fetchRepositories(`https://api.github.com/${isUser ? "users" : "orgs"}/${orgOrUser}/repos?sort=pushed`)
        );

        const allRepos = (await Promise.all(reposPromises))
            .flat()
            .filter(repo => repo); // Remove any null or undefined results

        allRepos.sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));
        const repoPromises = repositories.map(async (repo) => {
            try {
                const contributorsResponse = await fetch(repo.contributors_url);
                if (!contributorsResponse.ok) throw new Error("Failed to fetch contributors");
                repo.contributorsList = await contributorsResponse.json();
                return repo;
            } catch (error) {
                console.error(`Error processing repository ${repo.name}:`, error);
                return null; // Skip failed repositories
            }
            });
        
            await Promise.all(repoPromises);
    } catch (error) {
        console.error("Error fetching repositories:", error);
    }
}

async function fetchRepositories(url) {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error("Failed to fetch repositories");
    return response.json();
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