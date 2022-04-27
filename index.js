//getting properties from matter.js
const { Engine, Render, Runner, Composite, Bodies, Body, Events } = Matter;

const width = window.innerWidth - 20;
const height = window.innerHeight - 20;

const min = 5;
const max = 15;

const cellsHorizontal = Math.floor(Math.random() * (max - min) + min);
const cellsVertical = Math.floor(Math.random() * (max - min) + min) - 2;

//an individual wall's length
const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

//create an engine
const engine = Engine.create();
//disabling gravity
engine.world.gravity.y = 0;
const { world } = engine;
//create a renderer(canvas)
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		width: width,
		height: height,
		wireframes: false,
	},
});

//create walls
const walls = [
	Bodies.rectangle(width / 2, 0, width, 10, {
		isStatic: true,
		label: "frame",
		render: {
			fillStyle: "red",
		},
	}),
	Bodies.rectangle(width / 2, height, width, 10, {
		isStatic: true,
		label: "frame",
		render: {
			fillStyle: "red",
		},
	}),
	Bodies.rectangle(0, height / 2, 10, height, {
		isStatic: true,
		label: "frame",
		render: {
			fillStyle: "red",
		},
	}),
	Bodies.rectangle(width, height / 2, 10, height, {
		isStatic: true,
		label: "frame",
		render: {
			fillStyle: "red",
		},
	}),
];

//Maze generation
//for randomizing the order of the neighbors
const shuffle = arr => {
	let counter = arr.length;
	while (counter > 0) {
		const index = Math.floor(Math.random() * counter);

		counter--;

		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	}
	return arr;
};
//base grid creation
/*for example => 3x3 grid 
        [false,false,false]
        [false,false,false]
        [false,false,false]
*/
const grid = Array(cellsVertical)
	.fill(null)
	.map(() => Array(cellsHorizontal).fill(false));
const verticals = Array(cellsVertical)
	.fill(null)
	.map(() => Array(cellsHorizontal - 1).fill(false));
const horizontals = Array(cellsVertical - 1)
	.fill(null)
	.map(() => Array(cellsHorizontal).fill(false));

//picking a random starting cell
const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);
//the stepping process of moving around in the maze
const stepThroughCell = (row, column) => {
	//if i have visited the cell at [row,column], then return
	if (grid[row][column]) return;
	//mark cell as visited
	grid[row][column] = true;
	//assemble randomly ordered list of neighbors
	const neighbors = shuffle([
		[row - 1, column, "up"],
		[row, column + 1, "right"],
		[row + 1, column, "down"],
		[row, column - 1, "left"],
	]);
	//for each neighbor...
	for (let neighbor of neighbors) {
		const [nextRow, nextColumn, direction] = neighbor;
		//...see if neighbor is out of bounds
		if (
			nextRow < 0 ||
			nextRow >= cellsVertical ||
			nextColumn < 0 ||
			nextColumn >= cellsHorizontal
		) {
			continue;
		}
		//...if we've visited that neighbor, continue to next neighbor
		if (grid[nextRow][nextColumn]) continue;
		//...remove a wall from either horizontals or verticals
		if (direction === "left") {
			verticals[row][column - 1] = true;
		} else if (direction === "right") {
			verticals[row][column] = true;
		} else if (direction === "up") {
			horizontals[row - 1][column] = true;
		} else if (direction === "down") {
			horizontals[row][column] = true;
		}
		stepThroughCell(nextRow, nextColumn);
	}
	//visit that next cell
};
stepThroughCell(startRow, startColumn);

//iterating over horizontal walls
horizontals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) return;

		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX / 2,
			rowIndex * unitLengthY + unitLengthY,
			unitLengthX,
			4,
			{
				label: "wall",
				isStatic: true,
				render: {
					fillStyle: "#8FBDD3",
				},
			}
		);
		Composite.add(world, wall);
	});
});
//iterating over vertical walls
verticals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) return;

		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX,
			rowIndex * unitLengthY + unitLengthY / 2,
			4,
			unitLengthY,
			{
				label: "wall",
				isStatic: true,
				render: {
					fillStyle: "#8FBDD3",
				},
			}
		);
		Composite.add(world, wall);
	});
});

//creating the goal element
const goal = Bodies.rectangle(
	width - unitLengthX / 2,
	height - unitLengthY / 2,
	unitLengthX * 0.5,
	unitLengthY * 0.5,
	{
		label: "goal",
		isStatic: true,
		render: {
			fillStyle: "#5AA469",
		},
	}
);
Composite.add(world, goal);

//creating the playing ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
	label: "ball",
	render: {
		fillStyle: "#FDFFBC",
	},
});
Composite.add(world, ball);

//controlling the ball
document.addEventListener("keydown", event => {
	const { x, y } = ball.velocity;

	const velocity = 7;
	switch (event.key) {
		case "w":
		case "ArrowUp":
			Body.setVelocity(ball, { x, y: y - velocity });
			break;
		case "a":
		case "ArrowLeft":
			Body.setVelocity(ball, { x: x - velocity, y });
			break;
		case "s":
		case "ArrowDown":
			Body.setVelocity(ball, { x, y: y + velocity });
			break;
		case "d":
		case "ArrowRight":
			Body.setVelocity(ball, { x: x + velocity, y });
			break;

		default:
			break;
	}
});

//win condition
Events.on(engine, "collisionStart", event => {
	event.pairs.forEach(collision => {
		const labels = ["ball", "goal"];
		if (
			labels.includes(collision.bodyA.label) &&
			labels.includes(collision.bodyB.label)
		) {
			world.gravity.y = 1;
			world.bodies.forEach(body => {
				if (body.label === "wall" || body.label === "goal")
					Body.setStatic(body, false);
			});
			document.querySelector(".winner").classList.remove("hidden");
		}
	});
});

Composite.add(world, walls);
//run the renderer
Render.run(render);
//create runner
const runner = Runner.create();
//run the engine
Runner.run(runner, engine);
