# Table of Contents
- [Issue Tracker Guidelines](#issue-tracker): Rules for submitting bug reports or feature requests
- [Development Contribution](#development-contribution): How to compile ScollMagic and submit pull requests
- [Knowledge Contribution](#knowledge-contribution): Help other ScrollMagic users
- [Other Support](#other-support): Every little helps!

---

# Issue Tracker

The [ScrollMagic issue tracker](https://github.com/janpaepke/ScrollMagic/issues) is the preferred channel for bug reports, features requests and discussing pull requests, but please respect the following restrictions:

- Please **do not** use the issue tracker for personal support requests (use [Stack Overflow](https://stackoverflow.com/questions/tagged/scrollmagic) or [ScrollMagic Premium Support](https://support.scrollmagic.io/?utm_source=github&utm_medium=link)).
- Please **do not** derail or troll issues. Keep the discussion on topic and respect the opinions of others.
- Please **do not** hijack someone else's post: If you have a new issue, post it as such.

### Bug Reports

If you followed the [troubleshooting guide](https://github.com/janpaepke/ScrollMagic/wiki/Troubleshooting-Guide), you're sure the issue is caused by ScrollMagic and it's reproducable we really appreciate your bug report!  
Thank you for helping us maintain this project by abiding by these rules:

 - **Check**: Do a quick search first to see if someone else already reported your bug. If you can add further insight please reply to the same post.
 - **Caption**: Try to be descriptive and precise. Avoid generic titles like "Problem with Scrolling".
 - **Description**: Try to describe the issue as simple as possible.
 - **Configuration**: Please include OS, browser name and other information that might be necessary to reproduce your issue.
 - **Format**: Use paragraphs and structure your text using all the great features of [GitHub markdown](https://help.github.com/articles/github-flavored-markdown). Pay special attention to the triple ticks (\`\`\`) followed by the language name to ensure [syntax highlighting](https://help.github.com/articles/github-flavored-markdown#syntax-highlighting).
 - **Code**: In many cases constructive support can only be provided if the issue is accompanied by the __relevant__ code.
We can't stress the word 'relevant' enough: Please don't post 500 lines of code from three different files.
 - **Showcase**: The VERY best way to ensure quick and competent help is to provide an __isolated__ showcase of the issue.
This could be done on [jsfiddle](http://jsfiddle.net/), [CodePen](http://codepen.io/) or [Plunker](http://plnkr.co/edit).  
Again: Try to make this as concise as possible, instead of copying your entire website's code.  
*__HINT:__ For your convenience we prepared a jsfiddle base template for you: http://jsfiddle.net/janpaepke/noybd3m6/ (Please fork and then update.)*
 - **Links**: If you feel you HAVE to post a link to your own environment because an abstract example isn't possible for some reason, please make sure it's a dedicated URL which will remain available after your issue was resolved and development has finished to ensure future references.

### Feature requests

Feature requests are welcome. Please make a strong case why your feature would be useful not only to you, but also to others.

---

# Development Contribution
Want to dig into the source code of ScrollMagic or even contribute? Awesome!

In order to compile ScrollMagic, you will need [Node.js](http://nodejs.org/download/).
Once you installed node.js you are able to use [npm](https://www.npmjs.com/package/npm) to manage packages and [npx](https://www.npmjs.com/package/npx) and execute packages binaries.

### Prepare the Development Environment
Open your console (i.e. MacOS X Terminal) and navigate to the ScrollMagic directory.  
To install the necessary development dependencies, use npm:

```bash
$ npm install
```

Sit back and watch the magic happen – once it's done, so are you. Now you're ready to start building and testing.

### Build ScrollMagic
For clarity reasons the ScrollMagic source files are split up and can be found in `/dev/src`.
When building ScrollMagic these files are combined and saved to the appropriate locations. The build process also automatically checks for javascript errors and minifies the main file.

To initiate the build process run:

```bash
$ npx gulp
```

You can pass in various command line arguments to influence the build:

```
-b=[RELEASE] | alias: --bump=[RELEASE]
If supplied, this flag will update the ScrollMagic major, minor or patch version.
Can be 'major', 'minor' or 'patch' and will default to 'patch', if undefined.
example: npx gulp -b=patch

-o=DIR       | alias: --out=DIR
Define output directory. If not supplied the default directory '/scrollmagic' will be used.
example: npx gulp -o=tmp

-d=[DIR]     | alias: --doc=[DIR]
Flag to also update the docs. If no directory is provided the default output directory '/docs' will be used.
example: npx gulp -d

--debug
Enter debug mode: This will allow for 'debugger' statements to pass the source-check during compilation
example: npx gulp --debug

-h           | alias: -?
display available command line options
```

**EXAMPLE:** For new releases the build command would be:

```bash
$ npx gulp -b -d
```

This will update the version from X.X.1 to X.X.2 and also generate new docs.  
In most cases (i.e. for PRs) you won't need these parameters, though.

### Testing
ScrollMagic comes with a test suite that makes sure that everything works as expected after changing the source code. When using it, please make sure you have [Chrome](http://www.google.com/chrome/) installed on your machine.

To start the test suite call:

```bash
$ npm test
```

The testing environment will remain open and automatically restart the test cycle whenever you change something.  
*Tip:* In case you don't know – to quit the process use `ctrl+c`.

To run a single test cycle and exit immediately, use the following command:

```bash
$ npx gulp test
```

**NOTE**: The main scene methods have not been fully specced out yet, but will be added in the future.

### Pull Requests

Before sending a pull request, please make sure all tests run successfully.
When you've added a new feature to ScrollMagic please be sure to write a new test for it if you're able to do so.

Please __do not__ include dist files in your pull request (everything in `/scrollmagic`).
They will only be included with a new release and an updated version number.

### Directory Structure
Here's how the ScrollMagic source files are organized:

* `/dev` base folder for ScrollMagic development
  * `/dev/build` contains files relevant to the build, like configuration files or the masthead
  * `/dev/docs` contains configuration and template files for the docs generation
  * `/dev/src` all the ScrollMagic source files, including plugins
  * `/dev/tests` unit testing environment
    * `/dev/tests/fixtures` html files for usage in tests
    * `/dev/tests/karma` additional js files needed for the tests
    * `/dev/tests/spec` contains all the spec files written in [jasmine](http://jasmine.github.io)

---

# Knowledge Contribution

 - You can publish tutorials, make CodePens and examples to help other users to learn how to use ScrollMagic.
 - Support other users who [try to find solutions](https://stackoverflow.com/questions/tagged/scrollmagic) for their issues.
 - If you'd like to help manage the issue tracker, please [reach out](mailto:e-mail@janpaepke.de?subject=ScrollMagic-Wiki)!
 - If you're interested in contributing to the [ScrollMagic Wiki](https://github.com/janpaepke/ScrollMagic/wiki), please [reach out](mailto:e-mail@janpaepke.de?subject=ScrollMagic-Wiki)!

---

# Other Support

If you want to show your appreciation of ScrollMagic but the above methods are not for you there are still other ways to support ScrollMagic and contribute to its advancement:

 - You can consider making [a donation](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8BJC8B58XHKLL) so more time can be dedicated to maintaining the source code and helping the users. No donation is too small and every little helps!
 - You can spread the word about ScrollMagic on twitter or Facebook. Hashtag followerpower!
 - And last, but not least: Make awesome websites with ScrollMagic and show the world that this is not a tool meant to be overused and provoke an epileptic shock in the visitor, but engage him/her through content structuring and experience-enhancing storytelling.
