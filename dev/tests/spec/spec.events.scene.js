describe('ScrollScene - Events', function() {

    var log = console.log; // loging from jasmine
    beforeEach(function() {
        // disable internal logging
        spyOn(console, "log");
        spyOn(console, "warn");
        spyOn(console, "error");
        // default setup
        loadFixtures('container-scroll.html');
        $c = $('#scroll-container');
        ctrl = new ScrollMagic({container: $c})
    });

    afterEach(function () {
        ctrl.destroy();
    });


    describe("method", function () {
        
        describe(".on()", function () {
            xit("doessomething", function () {
            });
        });
        
        describe(".off()", function () {
            xit("doessomething", function () {
            });
        });

        describe(".trigger()", function () {
            xit("doessomething", function () {
            });
        });
    });


    it("triggers container resize event", function(done) {
        var resizeSpy = jasmine.createSpy('resizeSpy');
        $c.height(300);
        $c.on("resize", resizeSpy);
        setTimeout(function(){
            expect(resizeSpy).toHaveBeenCalled();
            done();
        }, 101); // 100 is default val for refresh interval
    });

    it("should trigger only 'enter' and 'start' for a zero duration scene", function() {
        var scene = new ScrollScene(
            {
                triggerElement: "#trigger",
                duration: 0
            })
            .addTo(ctrl);

        var events = ["enter", "leave", "start", "end"];
        var spy = {};
        events.forEach(function(val, i) {
            spy[val] = jasmine.createSpy(val);
            scene.on(val, spy[val]);
        });

        $c.scrollTop(200);
        ctrl.update(true);

        expect(spy.enter).toHaveBeenCalled();
        expect(spy.start).toHaveBeenCalled();
        expect(spy.end).not.toHaveBeenCalled();
        expect(spy.leave).not.toHaveBeenCalled();

    });

    it('should trigger enter 2x for zero duration scenes', function() {
        var scene = new ScrollScene(
            {
                triggerElement: "#trigger",
                duration: 0
            })
            .addTo(ctrl);

        var triggerSpy = jasmine.createSpy('triggerSpy');
        scene.on("enter", triggerSpy);

        var moveTop = function(){$c.scrollTop(0);};
        var moveMid = function(){$c.scrollTop(155);};

        moveMid();
        ctrl.update(true)
        moveTop();
        ctrl.update(true)
        moveMid();
        ctrl.update(true)
        expect(triggerSpy).toHaveBeenCalled();
        expect(triggerSpy.calls.count()).toBe(2);
    });

});