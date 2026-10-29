// Git clean filter for theme/config/settings_data.json (.gitattributes, `npm run setup:git`): commits the
// file with the theme's API secret (Theme settings > Integrations, "api_secret") blanked. The file on disk
// keeps it, so `theme dev` and `npm run release:live` still sign the wheel; git and GitHub never see it.
// stdin: the file as on disk; stdout: the file as committed.
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => process.stdout.write(input.replace(/("api_secret"\s*:\s*")[^"]*(")/g, '$1$2')));
