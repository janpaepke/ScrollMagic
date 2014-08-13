describe('ScrollMagic - Events (Overflow)', function() {

     beforeEach(function() {
        loadFixtures('overflow-scroll.html');
    });

    it("should trigger 'enter' and 'leave' for a zero duration scene", function(done) {
        $el = $('#scroll-container');

        var controller = new ScrollMagic({container: $el});

        var scene = new ScrollScene(
            {
                triggerElement: ".step:eq(5)",
                duration: 0
            })
            .addTo(controller);

        var triggerSpy = jasmine.createSpy('triggerSpy');
        scene.on("enter leave", triggerSpy);

        $el.scrollTop(155);

        setTimeout(function(){
            expect(triggerSpy).toHaveBeenCalled();
            expect(triggerSpy.calls.count()).toBe(2);
            done();
        }, 50);

    });

    it('should trigger enter for element 3x', function(done) {
        $el = $('#scroll-container');

        var controller = new ScrollMagic({container: $el});

        var scene = new ScrollScene(
            {
                triggerElement: ".step:eq(5)",
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
            expect(triggerSpy.calls.count()).toBe(3);
            done();
        }, 300);

    });

});