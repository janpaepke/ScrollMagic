# Table of Contents
- [Troubleshooting](#troubleshooting): How to resolve ScrollMagic issues
- [Support Guidelines](#support-guidelines): What to keep in mind when asking for help
- [Development Contribution](#development-contribution): Digging into the ScrollMagic source code
- [Library Support](#library-support): How to support the project outside of code contribution

---

# Troubleshooting

So you stuck with your ScrollMagic page and don't know what went wrong?  
Or you think you discovered a bug?  
We'd love to help you get to the bottom of it, but __before you post an issue__ please follow the following steps.

### 1. Make sure your console is clean.
ScrollMagic outputs a lot of useful debugging information to the console of your browser.
So make sure to check it first, when looking for the problem.  
In Chrome the console is opened by clicking "View -> Developer -> JavaScript console".

If no errors appear make use of ScrollMagic's debugging capabilities.
Both the [controller class](http://janpaepke.github.io/ScrollMagic/docs/ScrollMagic.Controller.html#constructor) as well as the [scene class](http://janpaepke.github.io/ScrollMagic/docs/ScrollMagic.Scene.html#constructor) offer the `loglevel` option, which, when set to 3, will output even more useful information.  
Does the controller update, when you scroll?  
Is your scene object behaving correctly?  
Do the events trigger at the right position?

### 2. Is there a problem with the animations?

#### 2.1 Make sure they are happening at the correct scroll position

Oftentimes the reason you don't see your animations is because they are happening outside of the viewport. Either before you scrolled past the element you are animating, or after.

An easy way to make sure is to add visual help by including the ScrollMagic debugging extension.  
Simply add the file reference into your html like this:
```html
<script type="text/javascript" src="scrollmagic/uncompressed/plugins/debug.addIndicators.js"></script>
```
Then use `scene.addIndicators()` to get visual indicators for where your scene should start and stop.

If you are sure that the scene is triggering when you want it to and the item is in view, then please...

#### 2.2 Make sure the problem lies with ScrollMagic, not with your animation Framework
Most animation-related problems are caused by an animation framework (TweenMax/Velocity) or a misuse thereof.  
A very common mistake for example, is that the selector for TweenMax turns up empty.

For TweenMax the recommended best practice is to create your tweens but **refrain from** adding them to the ScrollMagic scene object using `setTween`.
This ensures that ScrollMagic does not manipulate the animations in any way.  
If you have a look at your site now, you can check if the animations plays out the way you wanted to.  
If they don't, the problem is obviously not rooted in ScrollMagic.

Check out the [Greensock Forums](http://www.greensock.com/forums/forum/11-gsap/) to get help using TweenMax.  
Get help for VelocityJS on their [GitHub issues page](https://github.com/julianshapiro/velocity/issues).

Only hen you got the animation to play like intended, add it to the ScrollScene.

_**Hint:** If your animation is further down in the DOM and you can't reach it before it plays, just add a `delay` to it. Just don't forget to remove it once everything animates like you want it to._


### 3. Isolate the issue
Some problems are caused by other elements, scripts or overlapping scenes on the page. Try to make a separate test-page containing only the respective scene. This will also help you with step 5 (posting the issue).

### 4. Search for similar problems
Chances are someone already ran across something similar to what you are experiencing.  
Check [stackoverflow](http://stackoverflow.com/questions/tagged/scrollmagic) or use the [GitHub search](https://github.com/janpaepke/ScrollMagic/search) at the top of the page to see if there's already a solution waiting for you.

### 5. Post your question in the issues section
Once you completed steps 1 to 4 and still can't figure it out, you are welcome to post your question in the projects [issues section](https://github.com/janpaepke/ScrollMagic/issues). We'll be happy to help you with your problem.  
In order for us to be able to do that efficiently and also for future users to benefit from the solution we ask you to abide by the guidelines below.

---

# Support Guidelines

When posting a bug or a question, we request that you keep these guidelines in mind to make it easier for us to get you the best help we can and for everybody else to learn from the answers.

 - **Focus**: Only one issue per post, please.
 - **Caption**: Try to find a title that helps other people to see what the post is about and makes it easy find it later. Avoid generic titles like "Problem with Scrolling".
 - **Description**: Try to describe your problem as simple as possible and always keep in mind that the people reading it have no idea of your project and its parameters. How would you explain it to someone who doesn't even know ScrollMagic?
 - **Format**: Use Paragraphs and structure your text using all the great features of [GitHub markdown](https://help.github.com/articles/github-flavored-markdown). pay special attention to the tripple ticks (```) followed by a language name to ensure [syntax highlighting](https://help.github.com/articles/github-flavored-markdown#syntax-highlighting).  
Formatting greatly improves understanding and ultimately helps you to get better answers.
 - **Code**: In many cases constructive support can only be provided if the issue is accompanied by the __relevant__ code.  
We can't stress the word 'relevant' enough: Please don't post 500 lines of code from 3 files into your question.
 - **Showcase**: The VERY best way to ensure quick and competent help is to provide an __isolated__ showcase of the issue.
This could be done on [jsfiddle](http://jsfiddle.net/), [codepen](http://codepen.io/) or [Plunker](http://plnkr.co/edit).  
Again: Try to make this as concise as possible, instead of copying your entire website's code.
*__HINT:__ For your convenience we prepared a jsfiddle base template for you: http://jsfiddle.net/janpaepke/mnogw9b4/ (Please fork and then update.)*
 - **Links**: If you feel you HAVE to post a link to your own environment, because an abstract example isn't possible for some reason, please make sure it's a dedicated URL which will remain available after your issue was resolved and development has finished. This way it will be available for future users with the same problem.  

Thank you for helping me maintain this project by abiding by these rules.

One last note: When you receive GitHub notification email about your issue it allows you to directly reply to it. If you use this feature, please delete the original message so it doesn't clutter up the issues resource with redundancies.

---

# Development Contribution
You want to dig into the source code of ScrollMagic and maybe even contribute? Awesome!  
To be able to compile ScrollMagic, you will need [node.js](http://nodejs.org/) and [Gulp](http://gulpjs.com/).

If you don't already have them installed, here's how to get them:  
First download and install [node](http://nodejs.org/download/).  
Now use the <b>n</b>ode <b>p</b>ackage <b>m</b>anager, that comes with node, to install gulp globally.   
To do that just open your console (i.e.MacOS X Terminal) and type: `npm install gulp -g`

That's it! Now you're set to start developing!

### Prepare the Development Environment
Open your console and navigate to the ScrollMagic directory.  
To install the necessary development dependencies, use npm again:

```bash
$ npm install
```
Now watch the magic happen and once it's done, so are you. You are ready to start building and testing.

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
When building ScrollMagic these files are combined and saved to the appropriate locations. Among other things the build process also automatically checks for javascript errors and minifies the main file.

To initiate the build process run:

```bash
$ gulp
```

You can pass in various command line arguments to influence the build:

```
--ver=VERSION	
Updates the ScrollMagic version number
example: gulp -v=1.0.4
 	
-o=DIR			| alias: --out=DIR
Define output directory. If not supplied the default directory '/scrollmagic' will be used.
example: node build -o=tmp
 	
-d=[DIR]		| alias: --doc=[DIR]
Flag to also update the docs. If no directory is provided the default output directory '/docs' will be used.
example: node build -d
 	
-h				| alias: -?
display available command line options
```

So for new releases the build command would be:

```bash
$ gulp -v=2.1.1 -d
```
This will update the version to 2.1.1 and also generate new docs.  
In most cases you will not need these parameters, though.  

The build supports another relevant build option.  
During development phase you won't need to generate minified files or update docs.
So to save time and make the build finish much faster run this:

```bash
$ gulp development
```

This will exclusively generate new uncompressed dist files to `/scrollmagic/uncompressed`.

### Testing
ScrollMagic comes with a test suite that makes sure that everything works as expected after changing the source code.  
Make sure you have [Chrome](http://www.google.com/chrome/) installed on your machine.
To start the test suite call:

```bash
$ npm test
```

The testing environment will remain open and automatically restart the test cycle whenever you change something.  
*Tip:* In case you don't know – to quit the process use ctrl+c.

To run only a single test cycle and exit right after, use this:

```bash
$ gulp test
```

Before sending a pull request, please make sure all tests run successfully.  
When you added a new feature to ScrollMagic please be sure to write a new test for it, if you are able to.

**NOTE**: The main scene methods have not been fully specced out yet, but will be added in the future.

---

#Library Support

There are many ways in which you can support ScrollMagic and contribute to its advancement:

 - You can consider making [a donation](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8BJC8B58XHKLL) so more time can dedicated to maintaining the source code and helping the users. No donation is too small and every little helps!
 - You can write tutorials, make codepens and examples to help other users to learn how to use ScrollMagic. If you are interested in contributing to the [ScrollMagic Wiki](https://github.com/janpaepke/ScrollMagic/wiki), please [reach out](mailto:e-mail@janpaepke.de?subject=ScrollMagic Wiki)!
 - You can have a closer look at the banner at the bottom of the [demo page](http://janpaepke.github.io/ScrollMagic) - maybe click it from time to time? :)
 - You can spread the word about ScrollMagic on twitter or Facebook. Hashtag followerpower!
 - And last but not least: Make awesome websites with ScrollMagic and show the world that this is not a tool meant to be overused and provoke an epileptic shock in the visitor, but engage him through content structuring and experience-enhancing storytelling.
