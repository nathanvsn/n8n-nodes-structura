const { src, dest } = require('gulp');

function buildIcons() {
	return src('icons/**/*.svg').pipe(dest('dist/icons/'));
}

function buildNodeIcons() {
	return src('nodes/**/*.svg').pipe(dest('dist/nodes/'));
}

function buildNodeJson() {
	return src('nodes/**/*.json').pipe(dest('dist/nodes/'));
}

exports['build:icons'] = async function () {
	await buildIcons();
	await buildNodeIcons();
	await buildNodeJson();
};
