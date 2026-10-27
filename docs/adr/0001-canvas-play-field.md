# The game draws its play field on a canvas

Earth, the Ship, Asteroids and shots are drawn on one `<canvas>`, while
everything people read or click (Population, Wave and Ore, the Shop, the Menu,
the end screen) is ordinary HTML on top. Dozens of moving, colliding pieces at
60fps stutter as DOM or SVG elements, especially on phones; keeping the rest in
HTML keeps it testable with `data-cy`.
