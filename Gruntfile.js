var path = require('path');
var snippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;

module.exports = function ( grunt ) {
	var projectName = 'mytravis';

  grunt.initConfig({
    jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
      files: ['js/**/*.src.js', 'specs/**/*.spec.js']
    },

    uglify: {
      build: {
        src: ['js/**/*.src.js'],
        dest: 'build/'+projectName+'.min.js'
      }
    },

    cssmin: {
      build: {
        src: ['css/**/*.src.css'],
        dest: 'build/'+projectName+'.min.css'
      }
    },

		copy: {
			imgs: {
				files: [
					{src: ['imgs/**'], dest: 'build/'} // includes files in path and its subdirs
				]
			}
		},

    zip: {
      dist: {
        exclude: ['./.*', './node_modules*', './screenshots*'],
        src: '.',
        dest: ''+projectName+'.zip'
      }
    },

		connect: {
			pivotal: {
				options: {
					port: '9001',
					base: '.'
				}
			},

			livereload: {
        options: {
          port: '9001',
          middleware: function(connect, options) {
            return [snippet, connect.static(path.resolve(options.base))];
          }
        }
      }
		},

		url: {
			pivotal: {
				host: 'localhost',
				port: '<%=connect.pivotal.options.port%>',
				runner: '<%=jasmine.pivotal.options.outfile%>'
			}
		},

		livereload: {
      port: 35729
    },

	  jasmine: {
			pivotal: {
				src: [
				  'js/app.src.js',
					'js/controller/*.src.js',
					'js/model/*.src.js',
					'js/service/*.src.js'
				],
				options: {
					host: 'http://localhost:<%=connect.port%>/',
					vendor: [
						'js/vendor/o.min.js',
						'js/vendor/litemq.min.js',
						'js/vendor/jquery-1.9.1.min.js',
						'js/vendor/utils.src.js',
						'spec/spec.src.js'
					],
					specs: ['spec/**/*.spec.js'],
					outfile: 'runner.html'
				}
			}
		},
		
		regarde: {
			pivotal: {
				files: ['js/**/*.src.js', 'spec/**/*.spec.js'],
				tasks: ['jasmine:pivotal'],
				spawn: true
			},

      livereload: {
        files: ['js/**/*.src.js', 'spec/**/*.spec.js'],
        tasks: ['livereload']
      }
		}
  });

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-livereload');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-regarde');

  // Aliased tasks (for readability purposes on "build" task)
  grunt.registerTask('o:cssmin', 'cssmin:build');
  grunt.registerTask('o:jsmin', 'uglify:build');
  grunt.registerTask('o:jslint', 'jshint');
  grunt.registerTask('o:zip', 'zip:dist');
  grunt.registerTask('o:imgs', 'copy:imgs');

	// Batch taks
	grunt.registerTask('o:ci', ['connect:pivotal', 'jasmine']);
	grunt.registerTask('o:pivotal', ['connect:pivotal', 'regarde:pivotal']);
	grunt.registerTask('o:livereload', ['livereload-start', 'connect:livereload', 'jasmine:pivotal:build', 'url:pivotal', 'regarde:livereload']);
	grunt.registerTask('o:build', ['o:ci', 'o:jslint', 'o:jsmin', 'o:cssmin', 'o:imgs']);


	grunt.registerMultiTask('url', 'Mounts url on screen', function () {
		var host = this.data.host;
		var port = this.data.port;
		var runner = this.data.runner; 

		grunt.log.writeln( 'Specs can now be accessed on http://'+host+':'+port+'/'+runner );
	});

  grunt.registerMultiTask('zip', 'Creates package for deploy.', function () {
    var options, done = this.async();

    options = ['--exclude'].concat(this.data.exclude);
    options = options.concat(['-r', this.data.dest, this.data.src]);
    
    grunt.util.spawn({cmd: 'zip', args: options}, function (err, result, code) {
      var output = result.err || result.stdout;

			grunt.log.writeln( '\n'+output+'\n' );

			done(code>0? false: true);
    });
  });
};
