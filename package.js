Package.describe({
  name : "hipstersmoothie:scrollmagic",
  summary: "ScrollMagic repackaged for Meteor.",
  version: "0.0.1",
  git: " https://github.com/hipstersmoothie/Meteor-ScrollMagic"
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.3.1');
  api.use('jquery', 'client');
  api.use('infinitedg:gsap@1.13.1', 'client');
  api.addFiles('hipstersmoothie:scrollmagic.js', 'client');
});
