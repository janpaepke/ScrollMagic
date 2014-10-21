# Support Guidelines

Got stuck with your ScrollMagic page and don't know what went wrong?  
We'd love to help you, but before posting an issue please follow these steps and in most cases you will be able to figure it out yourself.

## 1. Make sure your console is clean.
ScrollMagic posts a lot of useful debugging information to the console of your browser.
So make sure to check it first, when looking for the problem.  
In Chrome the console is opened by clicking "View -> Developer -> JavaScript console".

If no errors appear make use of ScrollMagic's debugging capabilities.
Both the [controller class](http://janpaepke.github.io/ScrollMagic/docs/ScrollMagic.html#ScrollMagic) as well as the [scene class](http://janpaepke.github.io/ScrollMagic/docs/ScrollScene.html#ScrollScene) offer the `loglevel` option, which, when set to 3, will output even more useful information.  
Does the controller update, when you scroll?  
Is your scene object behaving correctly?

## 2. The tweens don't work?

### 2.1 Make sure they are happening at the correct scroll position

Many times the reason you don't see your tweens is because they are happening outside of the viewport. Either before you scrolled past the element you are animating, or after.

An easy way to make sure is to add visual help by including the ScrollMagic debugging extension.  
Simply add the file reference into your html like this:
```html
<script type="text/javascript" src="js/jquery.scrollmagic.debug.js"></script>
```
Then use `scene.addIndicators()` to get visual indicators for where your scene should start and stop.

If you are sure that the scene is triggering when you want it to and the item is in view, then please...

### 2.2 Make sure the problem is with ScrollMagic, not with TweenMax
With most tween-related problems the issue lies with CSS, TweenMax or a misuse thereof.  
For example a common mistake is that the selector for TweenMax turns up empty.

A best practice is usually to create your tweens but **do not** add them to the ScrollScene object using `setTween`.
Now look at your site and see if the animation plays out the way you wanted to.  
If it doesn't the problem is obviously not with ScrollMagic.

Check out the [Greensock Forums](http://www.greensock.com/forums/forum/11-gsap/) to get help using TweenMax.

Only once the animation plays like you want it to add it to the ScrollScene.

_**Hint:** If your animation is further down in the DOM and you can't reach it before it plays, make use of the `delay` option of TweenMax. Just don't forget to remove it once everything animates like you want it to._


## 3. Isolate the problem
A lot of times problems are caused by other elements or overlapping scenes on the page. Try to make a seperate test-page containing only the respective scene. This will also help you with step 5 (posting the issue).

## 4. Search for similar issues
Chances are someone already ran across something similar to what you are experiencing.
Make sure to use the [GitHub search](https://github.com/janpaepke/ScrollMagic/search) at the top of the page to find out.

## 5. Post your question in the issues section
Once you completed steps 1 to 4 and still can't figure it out, you are welcome to post your question [in the issues section](https://github.com/janpaepke/ScrollMagic/issues). We'll be happy to help you with your problem.  
But in order for us to be able to do that and also for future users to benefit from the solution we ask you to abide by these rules:
 - **Focus**: Only one issue per post, please.
 - **Caption**: Try to find a title that help other people to see what the post is about and avoid titles like "Problem with Scrolling" that really won't help anyone...
 - **Description**: Try to describe your problem as simple as possible and always keep in mind that the people reading it have no idea of your project and it's parameters. How would you explain it to someone who doesn't even know ScrollMagic?
 - **Format**: Use Paragraphs and structure your text using all the great features of [GitHub markdown](https://help.github.com/articles/github-flavored-markdown). pay special attention to the tripple ticks (```) followed by a language name to ensure [syntax highlighting](https://help.github.com/articles/github-flavored-markdown#syntax-highlighting).
 - **Code**: In almost all cases help can only be provided if the question is accompanied by the respective code. The VERY best way to do this is using [jsfiddle](http://jsfiddle.net/), [codepen](http://codepen.io/) or [Plunker](http://plnkr.co/edit). It provides an isolated showcase of the issue (which you already created in Step 3) and gives everyone else the opportunity to play around with the code to find out the problem. If feel you HAVE to post a link to your own environment, please make sure it's a special URL and try to keep it live even after development has finished. This way it will be available for future users with the same problem.  
*__HINT:__ To save you some work here is a jsfiddle base template for you to fork and use for issue reports: http://jsfiddle.net/janpaepke/nouw0rgv (Please fork and then update.)*

Thank you for helping me maintain this project by abiding by these rules.

**For Github issues please avoid**:
- Hitting reply in the GitHub notification email and leaving the original message in. If you love to use the direct email reply feature, please make sure to delete the original.
- Posting links to your website and removing them after the issue is solved. This takes away the possibility to learn for future users.

---
# Development Contribution
You want to dig into the source code of ScrollMagic and maybe even contribute? Awesome!  
Make sure you have [node.js](http://nodejs.org) installed and running on your system.  
To find out just open your Console (MacOsX Terminal) and type `node -v`.

## Directory Structure
* `/dev` base folder for ScrollMagic development
	* `/dev/docs` contains configuration and template files for the docs generation
	* `/dev/src` all the ScrollMagic source files
	* `/dev/tests` testing environment
		* `/dev/tests/fixtures` html files for usage in tests
		* `/dev/tests/spec` contains all the spec files written in [jasmine](http://jasmine.github.io)

## Prepare the Development Environment
Open your console and navigate to the ScrollMagic directory.  
Now we need to install the necessary components using the <b>n</b>ode <b>p</b>ackage <b>m</b>anager (comes with node):
```bash
$ npm install
```
Now watch the magic happen and once it's done so are you. You are ready to start building and testing.

## Build ScrollMagic
For clarity reasons the ScrollMagic source files are split up and can be found in `/dev/src`.
To combine all source files and store them in their correct location we need to run the build.js file from node.  
The build process also automatically checks for javascript errors and minifies the main file.
This is achieved by calling:
```bash
$ node dev/build
```
You can pass in various arguments to customize the build:
```
 	-v=VERSION	| alias: -version
 	Update Version number
 	example: node build -v=1.0.4
 	
 	-o=DIR			| alias: -out=DIR
 	Define output directory. If not supplied the default directory '/js' will be used.
 	example: node build -o=tmp
 	
 	-d=[DIR]		| alias: -docs=[DIR]
 	Flag to also update the docs. If no directory is provided the default output directory '/docs' will be used.
 	example: node build -d
```
So for new releases the build command is this
```bash
$ node dev/build -v=1.1.1 -d
```
This will update the version to 1.1.1 and also generate new docs.  

In most cases though you will only need to call the basic command:
```bash
$ node dev/build
```

## Test ScrollMagic
ScrollMagic comes with a test suite that makes sure that everything works as expected after changing the source code.  
**NOTE**: The main scene methods have not been fully specced out yet, but will be added in the future.
To start the test suite call:
```bash
$ npm test
```
It will stay active an automatically restart the test cycle whenever you change something.  
*Tip:* In case you don't know – to quit the process use ctrl+c.

To run only a single test cycle and exit after use this:
```bash
$ npm run test-single-run
```

When you added a new feature to ScrollMagic please be sure to write a new test for it, if you are able to.
