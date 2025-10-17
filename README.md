# npm-set-trusted-publishing

This script automates the process of setting up trusted publishers for npm packages using Puppeteer.

Given that npm is the best website in the world and users want to spend as much time on
it as possible, the only supported way of setting up trusted publishing is manually,
package by package. Unfortunately, I have to do it for 200 packages, and as much as I love
the npm website I also have a life and I cannot spend all day clicking buttons.

This script clicks buttons for me. The good news for npm-website-lovers is that you can
still look at the screen while it does so! You will sometimes even have to interact
with it, for example for the initial 2FA login or when npm asks to confirm that you are
not a robot.

## Usage

If you want to use this script yourself, download the repository and:
- run `npm ci` to install puppeteer
- update `./config.json` with your npm details and the list of packages you want to set up
- optionally define the `NPM_PASSWORD` environment variable with your npm password to avoid
  having to manually type it in the login form
- run `node ./index.ts` to start the script
- get a comfy blanket, a cup of tea, and enjoy the show

Disclaimer: read the code before running it, I am not responsible for any damage it may cause.
