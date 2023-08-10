
build:
	@yarn build

publish: build
	@npm publish --access=public
