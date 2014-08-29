describe('ScrollMagic - Events (Overflow)', function() {

     beforeEach(function() {
        loadFixtures('container-scroll.html');
    });

    it("should trigger only 'enter' and 'start' for a zero duration scene", function(done) {
        $el = $('#scroll-container');

        var controller = new ScrollMagic({container: $el});

        var scene = new ScrollScene(
            {
                triggerElement: "#trigger",
                duration: 0
            })
            .addTo(controller);

        var events = ["enter", "leave", "start", "end"];
        var spy = {};
        events.forEach(function(val, i) {
            spy[val] = jasmine.createSpy(val);
            scene.on(val, spy[val]);
        });

        $el.scrollTop(200);

        setTimeout(function(){
            expect(spy.enter).toHaveBeenCalled();
            expect(spy.start).toHaveBeenCalled();
            expect(spy.end).not.toHaveBeenCalled();
            expect(spy.leave).not.toHaveBeenCalled();
            done();
        }, 50);

    });

    it('should trigger enter 2x for zero duration scenes', function(done) {
        $el = $('#scroll-container');

        var controller = new ScrollMagic({container: $el});

        var scene = new ScrollScene(
            {
                triggerElement: "#trigger",
                duration: 0
            })
            .addTo(controller);

        var triggerSpy = jasmine.createSpy('triggerSpy');
        scene.on("enter", triggerSpy);

        var moveTop = function(){$el.scrollTop(0);};
        var moveMid = function(){$el.scrollTop(155);};

        moveMid();
        setTimeout(moveTop, 100);
        setTimeout(moveMid, 200);

        setTimeout(function(){
            expect(triggerSpy).toHaveBeenCalled();
            expect(triggerSpy.calls.count()).toBe(2);
            done();
        }, 300);

    });

});