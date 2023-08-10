
build:
	@rm -rf lib
	@yarn build

publish: build
	@npm publish --access=public
