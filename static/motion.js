var motion = { stop: {}, run: {}, other: {} };

motion.stop.left = [ 0, 0 ];
motion.run.left = [ [ 1, 0 ], [ 2, 0 ], [ 3, 0 ], [ 2, 0 ] ];
motion.stop.right = [ 0, 1 ];
motion.run.right = [ [ 1, 1 ], [ 2, 1 ], [ 3, 1 ], [ 2, 1 ] ];
motion.stop.down = [ 0, 2 ];
motion.run.down = [ [ 1, 2 ], [ 0, 2 ], [ 2, 2 ], [ 0, 2 ] ];
motion.stop.up = [ 0, 3 ];
motion.run.up = [ [ 1, 3 ], [ 0, 3 ], [ 2, 3 ], [ 0, 3 ] ];
motion.other.spin = [ [ 0, 0 ], [ 5, 2 ], [ 4, 2 ], [ 0, 3 ], [ 4, 3 ], [ 5, 3 ], [ 0, 1 ], [ 0, 2 ] ] ;
