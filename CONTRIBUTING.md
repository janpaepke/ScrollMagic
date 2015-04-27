# Table of Contents
- [Troubleshooting](#troubleshooting): How to resolve ScrollMagic issues
- [Support Guidelines](#support-guidelines): What to keep in mind when asking for help
- [Development Contribution](#development-contribution): Digging into the ScrollMagic source code
- [Library Support](#library-support): How to support the project outside of code contribution

---

# Troubleshooting

While developing with ScrollMagic something became stuck and you don't know what went wrong?  
Or you think you may have discovered a bug?

We'd love to help you get to the bottom of it, but __before you post an issue__ please proceed in the following order…

### 1. Make sure your console is clean.
ScrollMagic outputs a lot of useful debugging information to the console of your browser.
So make sure to check it first when inspecting the problem.  
In Chrome the console is opened by clicking "View → Developer → JavaScript console".

If no errors are appear, make use of ScrollMagic's debugging capabilities.
Both the [controller class](http://scrollmagic.io/docs/ScrollMagic.Controller.html#constructor) as well as the [scene class](http://scrollmagic.io/docs/ScrollMagic.Scene.html#constructor) offer the `loglevel` option, and when set to 3 it will output even more useful information.

- Does the controller update, when you scroll?
- Is your scene object behaving correctly?
- Do the events trigger at the correct position?

### 2. Is there a problem with the animations?

#### 2.1 Make sure they're happening at the correct scroll position

Quite often the reason you don't see your animations is because they're happening outside of the viewport either before you scrolled past the element you're animating or immediately following.

An easy way to make sure is to add visual help by including the ScrollMagic indicators plugin.

Simply add the file reference into your html:

```html
<script type="text/javascript" src="scrollmagic/uncompressed/plugins/debug.addIndicators.js"></script>
```

Then use `scene.addIndicators()` to obtain visual indicators depicting where your scene should start and stop.

If you're sure that the scene is triggering when you desire and the item is in view, then please do the following...

#### 2.2 Make sure the problem lies with ScrollMagic and not with your animation Framework
Most animation-related problems are caused by an animation framework (GSAP/Velocity) or a misuse thereof. A very common mistake for example, is that the selector for TweenMax turns up empty.

For GSAP the recommended best practice is to create your tweens, but **refrain from** adding them to the ScrollMagic scene object using `setTween`.
This ensures that ScrollMagic doesn't manipulate the animations in any way.  
If you have a look at your site now, you can check if the animations plays out the way you wanted to. If they don't, the problem is obviously not rooted in ScrollMagic.

Check out the [GreenSock Forums](http://www.greensock.com/forums/forum/11-gsap/) to get help using GSAP.  
Get help for VelocityJS on their [GitHub issues page](https://github.com/julianshapiro/velocity/issues).

Once you have your animation playing as intended, add it to the ScrollScene.

_**Hint:** If your animation is further down in the DOM and you can't reach it before it plays, just add a `delay` to it. Just don't forget to remove it once everything animates like you want it to._


### 3. Isolate the issue
Some problems are caused by other elements, scripts or overlapping scenes on the page. Try to make a separate test-page containing only the respective scene. This will also help you with step 5 (posting the issue).

### 4. Search for similar problems
Chances are someone already ran across something similar to what you're experiencing.  
Check [stackoverflow](http://stackoverflow.com/questions/tagged/scrollmagic) or use the [GitHub search](https://github.com/janpaepke/ScrollMagic/search) at the top of the page to see if there's already a solution waiting for you.

### 5. Post your question in the issues section
Once you've completed steps 1 - 4 and still have no resolution, you're welcome to post your question in the projects [issues section](https://github.com/janpaepke/ScrollMagic/issues). We'll be happy to help you with your problem.  
In order for us to be able to do that efficiently, and also for future users to benefit from the solution, we ask you to abide by the guidelines below.

---

# Support Guidelines

When posting a bug or a question, we request that you keep these guidelines in mind to make it easier for us to get you the best help we can and for everybody else to learn from the answer.

 - **Focus**: Only one issue per post, please.  
 Don't hijack someone else's post: If you have a new question, please post a new issue.
 - **Caption**: Try to find a title that helps other people see what the post is about and makes it easy to find later. Avoid generic titles like "Problem with Scrolling".
 - **Description**: Try to describe your problem as simple as possible and always keep in mind that the people reading it have no idea about your project and its parameters. How would you explain it to someone who doesn't even know ScrollMagic?
 - **Configuration**: Please include OS, browser name and other information that might be necessary to reproduce your issue.
 - **Format**: Use paragraphs and structure your text using all the great features of [GitHub markdown](https://help.github.com/articles/github-flavored-markdown). Pay special attention to the triple ticks (\`\`\`) followed by the language name to ensure [syntax highlighting](https://help.github.com/articles/github-flavored-markdown#syntax-highlighting). Formatting greatly improves understanding and ultimately helps you to get better answers.
 - **Code**: In many cases constructive support can only be provided if the issue is accompanied by the __relevant__ code.
We can't stress the word 'relevant' enough: Please don't post 500 lines of code from 3 files into your question.
 - **Showcase**: The VERY best way to ensure quick and competent help is to provide an __isolated__ showcase of the issue.
This could be done on [jsfiddle](http://jsfiddle.net/), [CodePen](http://codepen.io/) or [Plunker](http://plnkr.co/edit).  
Again: Try to make this as concise as possible, instead of copying your entire website's code.  
*__HINT:__ For your convenience we prepared a jsfiddle base template for you: http://jsfiddle.net/janpaepke/nLzgLL1s/ (Please fork and then update.)*
 - **Links**: If you feel you HAVE to post a link to your own environment because an abstract example isn't possible for some reason, please make sure it's a dedicated URL which will remain available after your issue was resolved and development has finished. This way it will be available for future users with the same problem.

Thank you for helping us maintain this project by abiding by these rules.

*One last note*: When you receive a GitHub notification email about your issue it allows you to directly reply to it. If you use this feature, please delete the original message so it doesn't clutter up the issues resource with redundancies.

---

# Development Contribution
Wanna dig into the source code of ScrollMagic or even contribute? Awesome!
In order to compile ScrollMagic, you'll need [Node](http://nodejs.org/) and [Gulp](http://gulpjs.com/).

If you don't already have them installed, here's how to get them:  
First, download and install [Node](http://nodejs.org/download/).  
Now use the <b>n</b>ode <b>p</b>ackage <b>m</b>anager, that comes installed with Node.  
To install gulp globally open your console (i.e.MacOS X Terminal) and type: `npm install gulp -g`

That's it! Now you're set to start developing!

### Prepare the Development Environment
Open your console and navigate to the ScrollMagic directory.  
To install the necessary development dependencies, use npm again:

```bash
$ npm install
```

Sit back and watch the magic happen – once it's done, so are you. Now you're ready to start building and testing.

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

### Build ScrollMagic
For clarity reasons the ScrollMagic source files are split up and can be found in `/dev/src`.
When building ScrollMagic these files are combined and saved to the appropriate locations. The build process also automatically checks for javascript errors and minifies the main file.

To initiate the build process run:

```bash
$ gulp
```

You can pass in various command line arguments to influence the build:

```
-b=[RELEASE] | alias: --bump=[RELEASE]
If supplied, this flag will update the ScrollMagic major, minor or patch version.
Can be 'major', 'minor' or 'patch' and will default to 'patch', if undefined.
example: gulp -b=patch

-o=DIR       | alias: --out=DIR
Define output directory. If not supplied the default directory '/scrollmagic' will be used.
example: node build -o=tmp

-d=[DIR]     | alias: --doc=[DIR]
Flag to also update the docs. If no directory is provided the default output directory '/docs' will be used.
example: node build -d

-h           | alias: -?
display available command line options
```

For new releases the build command would be:

```bash
$ gulp -b -d
```

This will update the version from X.X.1 to X.X.2 and also generate new docs.  
In most cases you won't need these parameters, though.

The build supports another relevant option: During the development phase you won't need to generate minified files or update docs. In order to save time and make the build finish much faster run this:

```bash
$ gulp development
```

This will exclusively generate new, uncompressed dist files to `/scrollmagic/uncompressed`.

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
$ gulp test
```

**NOTE**: The main scene methods have not been fully specced out yet, but will be added in the future.

### Pull Requests

Before sending a pull request, please make sure all tests run successfully.
When you've added a new feature to ScrollMagic please be sure to write a new test for it if you're able to do so.

Please __do not__ include dist files in your pull request (everything in `/scrollmagic`).
They will only be included with a new release and an updated version number.

---

#Library Support

There are many ways in which you can support ScrollMagic and contribute to its advancement:

 - You can consider making [a donation](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8BJC8B58XHKLL) so more time can be dedicated to maintaining the source code and helping the users. No donation is too small and every little helps!
 - You can write tutorials, make CodePens and examples to help other users to learn how to use ScrollMagic. If you're interested in contributing to the [ScrollMagic Wiki](https://github.com/janpaepke/ScrollMagic/wiki), please [reach out](mailto:e-mail@janpaepke.de?subject=ScrollMagic Wiki)!
 - You can have a closer look at the at the bottom banner of the [demo page](http://scrollmagic.io) - maybe click it from time to time? :)
 - You can spread the word about ScrollMagic on twitter or Facebook. Hashtag followerpower!
 - And last, but not least: Make awesome websites with ScrollMagic and show the world that this is not a tool meant to be overused and provoke an epileptic shock in the visitor, but engage him/her through content structuring and experience-enhancing storytelling.
