import puppeteer from "puppeteer";
import config from "./config.json" with { type: "json" };

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();

await login(
  config.npm_username,
  config.npm_password_env_var && process.env[config.npm_password_env_var]
);
console.log("Logged in to npm");

for (const pkg of config.packages) {
  if (config.slowdown) {
    await new Promise(r => setTimeout(r, config.slowdown * 1000));
  }

  let name: string;
  let { gh_owner, gh_repo, gh_workflow, gh_environment } = config;
  if (Array.isArray(pkg)) {
    name = pkg[0] as string;
    if (pkg.length > 1 && typeof pkg[1] === "object") {
      ({
        gh_owner = gh_owner,
        gh_repo = gh_repo,
        gh_workflow = gh_workflow,
        gh_environment = gh_environment
      } = pkg[1] as { gh_owner?: string; gh_repo?: string; gh_workflow?: string; gh_environment?: string });
    }
  } else {
    name = pkg;
  }

  if (!gh_owner) throw new Error(`Package ${pkg[0]} is missing "gh_owner" configuration`);
  if (!gh_repo) throw new Error(`Package ${pkg[0]} is missing "gh_repo" configuration`);
  if (!gh_workflow) throw new Error(`Package ${pkg[0]} is missing "gh_workflow" configuration`);

  await setupPackage(name, gh_owner, gh_repo, gh_workflow, gh_environment).catch(err => {
    console.error(`ERROR setting up package ${name}: ${err}`);
  });
}

async function enterData(selector: string, data: string) {
  await page.click(selector);
  await page.type(selector, data);
}

async function login(username?: string, password?: string) {
  await page.goto("https://www.npmjs.com/login");
  if (username && password) {
    await enterData("#login_username", username);
    await enterData("#login_password", password);
    await page.click('#login button[type="submit"]');
  } else if (username) {
    await enterData("#login_username", username);
    await page.focus("#login_password");
  } else if (password) {
    await page.type("#login_password", password);
    await page.focus("#login_username");
  } else {
    await page.focus("#login_username");
  }

  do {
  } while (!(await page.waitForSelector(`[aria-label="Profile menu"]`, { timeout: 500 }).catch(() => null)));
}

async function setupPackage(name: string, gh_owner: string, gh_repo: string, gh_workflow: string, gh_environment?: string) {
  const packageUrl = `https://www.npmjs.com/package/${name}/access`;
  const gotoResponse = await page.goto(packageUrl);
  if (!gotoResponse || !gotoResponse.ok()) {
    console.log(`SKIP ${name} (error ${gotoResponse?.status() ?? ""} while loading access settings)`);
    return;
  }

  if (await page.$('#github-repoInfo')) {
    console.log(`SKIP ${name} (already set up)`);
    return;
  }

  await page.click(`button[aria-label="Add Trusted Publisher connection for GitHub Actions"]`);
  await page.waitForSelector("#oidc_repositoryOwner");

  await enterData("#oidc_repositoryOwner", gh_owner);
  await enterData("#oidc_repositoryName", gh_repo);
  await enterData("#oidc_workflowName", gh_workflow);
  if (gh_environment) {
    await enterData("#oidc_githubEnvironmentName", gh_environment);
  }

  await page.click('#oidc button[type="submit"]');

  await page.waitForNavigation();
  await page.waitForSelector('#github-repoInfo');

  console.log(`DONE ${name}`);
}

await page.close();
await browser.close();
