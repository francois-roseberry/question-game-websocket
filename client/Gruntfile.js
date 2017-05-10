"use strict";

var karmaRunner = require('./build/karma_runner');
var buildServices = require('./build/build-services.js');

module.exports = function(grunt) {

	// Default task, do everything
	grunt.registerTask('default', 'Build and test everything', ['lint', 'package', 'test']);

	// Quick build
	grunt.registerTask('check', ['lint', 'package', 'runTest']);

	// Code quality
	grunt.registerTask('lint', ['jshint', 'csslint']);
	grunt.registerTask('test', ['service', 'runTest']);
	grunt.registerTask('runTest', ['karmaTest', 'mochaTest']);

	grunt.registerTask('karmaTest', 'Run the client unit test in all browser connected to Karma', function () {
	  karmaRunner.runTests(grunt, this.async());
	});

	// Packaging
	grunt.registerTask('prepare', ['copy:html', 'copy:flattenSourceAndTest', 'copy:flattenSmokeTest']);
	grunt.registerTask('copySource', ['copy:lib', 'copy:images', 'copy:sounds', 'copy:fonts', 'copy:data']);
	grunt.registerTask('minify', ['cssmin']);
	grunt.registerTask('package', ['prepare', 'browserify', 'concat', 'copySource', 'minify']);

	// Background services
	grunt.registerTask('background', ['service', 'wait']);
	grunt.registerTask('service', ['karmaServer', 'server', 'webdriver']);

	grunt.registerTask('server', function () {
	  buildServices.startServer(this.async());
	});

	grunt.registerTask('karmaServer', function () {
	  buildServices.startKarmaServer(this.async());
	});

	grunt.registerTask('webdriver', 'Start PhantomJS in WebDriver mode', function () {
	  buildServices.startPhantomJsWebdriver(this.async());
	});

	grunt.registerTask('wait', 'wait until the exit, useful for background services', function () {
	  grunt.log.writeln("Background service started".green);
	  grunt.log.writeln("Run 'grunt check' to do a quick build while this process is running");
	  this.async();
	});

	grunt.initConfig({
		jshint: {
			options: {
				jshintrc: "build/jshintrc"
			},
			all: {
				src: [
					'Gruntfile.js',
					'build/**/*.js',
					'src/**/*.js',
					exclude('src/**/i18n.*.js')
				]
			}
		},

		csslint: {
			options: {
				csslintrc: 'build/csslintrc'
			},
			all: {
				src: ['src/**/*.css']
			}
		},

		browserify: {
			dist: {
				files: {
					'./target/dist/lib/app.js': ['target/stagger/src/bootstrap.js']
				}
			}
		},

		concat: {
			dependencies: {
				src: [
				    'bower_components/jquery/dist/jquery.min.js',
						'bower_components/underscore/underscore.js',
						'bower_components/d3/d3.min.js',
						'bower_components/rxjs/dist/rx.all.min.js',
						'bower_components/bootstrap/dist/js/bootstrap.min.js'
				],
				dest: 'target/dist/lib/dependencies.js'
			}
		},

		copy: {
			flattenSourceAndTest: {
				expand: true,
				src: ['src/main/**/*.js',
					'src/test/unit/**/*.js',
					'src/test/integration/**/*.js'],
				dest: 'target/stagger/src',
				filter: 'isFile',
				flatten: true
			},

			flattenSmokeTest: {
				expand: true,
				src: ['src/test/smoke/**/*.js',
					'src/test/page-object/**/*.js'],
				dest: 'target/stagger/smoke',
				filter: 'isFile',
				flatten: true
			},

			lib: {
				expand: true,
				cwd: 'bower_components',
				src: [
					'bootstrap/dist/css/bootstrap.css'
				],
				dest: 'target/dist/lib',
				filter: 'isFile',
				flatten: true
			},

			html: {
				src: ['src/static/index.html'],
				dest: 'target/dist/index.html',
				filter: 'isFile'
			},

			images: {
                expand: true,
                cwd: 'src/images',
                src: [
                    '**/*'
                ],
                dest: 'target/dist/images',
                filter: 'isFile'
            },

			fonts: {
				expand: true,
				cwd: 'bower_components',
				src: [
					'bootstrap/dist/fonts/*.*'
				],
				dest: 'target/dist/fonts',
				filter: 'isFile',
				flatten: true
			},

			sounds: {
				expand: true,
				cwd: 'src/sounds',
				src: [
					'**/*'
				],
				dest: 'target/dist/sounds',
				filter: 'isFile',
				flatten: true
			},

			data: {
				expand: true,
				src: [
					'src/**/*.GEOJSON',
					'src/**/*.xml'
				],
				dest: 'target/dist/lib',
				flatten: true
			}
		},

		mochaTest: {
			smoke: {
				options: {
					reporter: 'list'
				},

				src: ['target/stagger/smoke/*']
			}
		},

		cssmin: {
			target: {
				files: {
					'target/dist/styles.min.css': [
													'src/**/*.css',
													'node_modules/jquery-ui/themes/ui-lightness/jquery-ui.min.css'
												]
				}
			}
		},

		clean: ['target/**']
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-csslint');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');

	function exclude(filePattern) {
        return '!' + filePattern;
    }
};
