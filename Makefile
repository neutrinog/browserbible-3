stat:
	git status -s

build:
	npm install .
	gulp uw:build

commit:
	git diff >/tmp/git-diff.out 2>&1
	git commit -a
	git pull --no-edit origin master
	git push origin master
	echo "Check https://bible-test.unfoldingword.org/ in a few moments"

publish:
	touch publish
	git add publish
	git commit publish -m 'Publishing site'
	git push origin master
	sleep 2
	echo "Waiting for S3 sync to finish"
	sleep 15
	echo "Check https://bible.unfoldingword.org/"
	rm -f publish
	git commit publish -m 'Cleaning up'
	git push origin master
