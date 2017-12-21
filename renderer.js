//let _ = require('underscore');

/* 0 is a unit DECREMENTED, 1 is a number of days to spend. Order matters */
/* affected by input, so not constant */
/* reversed to be used with .push() and .pop() */
let norms_list = [
	[[4,1], [1,4], [3,6], [2,4], [2,2], [1,4], [0,3]],
	[[4,1], [1,2], [3,7], [2,3], [0,5]],
	[[2,6], [2,2], [3,3], [0,5], [1,7], [2,4], [2,1], [2,2], [1,4]],
	[[4,2], [3,2], [2,4], [2,5], [2,3], [1,5], [0,2]],
	[[4,4], [2,2], [1,3], [3,8], [0,2], [2,3], [1,5]]
];

let population = [];

/* numbers of workers, associated with particular units */
const units = [[0,1], [2,3], [4,5], [6], [7]];
const MAX_WORKER = 7;
const IDLE = -1;

function init() {
	d3.select('#scale')
		.selectAll('div')
		.data(['1.1', '1.2', '2.1', '2.1', '3.1', '3.2', '4.1', '5.1'])
		.enter()
		.append('div')
		.style('width', '5rem')
		.style('height', '5rem')
		.text((d) => { return d; });

	draw_btns(norms_list.length);
	regen();
}

const color = ['#e61717', '#e68917', '#7683e7', '#12b812', '#6b1799'];
const hov_color = ['#7b0404', '#7b4604', '#23319e', '#036303', '#4e2d60'];

function draw(s) {
	draw_plot(s);
	print_times(s);
}

function draw_plot(schedule) {
	const len = entity_length(schedule);

	// the wrost thing I've ever done
	document.querySelector('.plan').innerHTML = '';
	// draw rows of data
	d3.select('.plan')
		.selectAll('div')
		.data(schedule)
		.enter()
		.append('div')
		.style('width', `${len*5.5}rem`)
		.style('height', '5rem')
		.attr('class', (d,i) => { return `row row-${i}`; });

	// draw cols
	for (let i = 0; i < schedule.length; ++i) {
		d3.select(`.row-${i}`)
			.selectAll('div')
			.data(schedule[i])
			.enter().append('div')
			.attr('class', 'col')
			.style('height', '5rem')
			.style('width', (d) => { return d[1]*5 + 'rem'; })
			.style('background-color', (d) => {
				return d[0] < 0 ? '#eee' : color[d[0]];
			})
			.style('color', (d) => {
				return d[0] < 0 ? '#eee' : color[d[0]];
			})
			.text((d) => { return d[0] < 0 ? '.' : `#${d[0]}`; })
			.on("mouseover", function(d) {
				// shade
				if (d[0] >= 0) {
					d3.select(this)
						.transition()
						.duration(200)
						.style("background-color", hov_color[d[0]])
						.style("color", hov_color[d[0]]);
				}
				tip.transition()
					.duration(200)
					.style("opacity", .9);
				tip.html((d[0] < 0 ? 'Простой' : `Деталь ${d[0]+1}`)
					+ `, ${d[1]} ${days(d[1])}`)
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY) + "px");
			})
			.on('mousemove', function(d) {
				tip.style('left', (d3.event.pageX) + 'px')
					.style('top', (d3.event.pageY) + 'px');
			})
			.on("mouseout", function(d) {
				// shade
				if (d[0] >= 0) {
					d3.select(this)
						.transition()
						.duration(200)
						.style("background-color", color[d[0]])
						.style("color", color[d[0]]);
				}
				tip.transition()
					.duration(500)
					.style("opacity", 0);
			});
		;
	}

	// tooltip
	let tip = d3.select("body").append("div")	
		.attr("class", "tooltip")				
		.style("opacity", 0);
}

function print_times(schedule) {
	d3.selectAll('#time li > span')
		.data(det_time(schedule))
		.text((d) => {
			return `${d} ${days(d)}`;
		});
}

function draw_btns(num) {
	d3.select('#btns')
		.selectAll('div')
		.data(_.range(num))
		.enter()
		.append('button')
		.style('border-color', (d) => { return color[d]; })
		.text((d) => {
			return `Деталь ${d+1}`;
		})
		.on('mouseover', function(d) {
			d3.select(this)
				.transition()
				.style('background-color', (d) => {
					return color[d];
				})
				.style('color', 'white');
		})
		.on('mouseout', function(d) {
			if (d3.select(this).classed('btn-on')) return;
			d3.select(this)
				.transition()
				.style('background-color', 'white')
				.style('color', 'black');
		})
		.on('click', function(d) {
			d3.select('.btn-on')
				.style('background-color', 'white')
				.style('color', 'black')
				.classed('btn-on', false);
			d3.select(this).classed('btn-on', true);
			show_norm(d);
		});
}

function show_norm(num) {
	document.getElementById('norm-ed').innerHTML = '';
	d3.select('#norm-ed')
		.selectAll('div')
		.data(norms_list[num])
		.enter()
		.append('div')
		.text((d) => { return `Подразделение ${d[0]+1}` })
		.append('input')
		.attr('type', 'number')
		.attr('min', 1)
		.attr('value', function(d) { return d[1]; })
		.on('change', function(d, i) {
			let n = norms_list[num].length - 1 - i;
			console.log(n);
			norms_list[num][n][1] = parseInt(this.value);
			console.log(JSON.stringify(norms_list[num]));
		});
}

function draw_stat() {
	document.getElementById('stats').innerHTML = '';
	d3.select('#stats')
		.selectAll('div')
		.data(population)
		.enter()
		.append('div')
		.attr('class', (d, i) => { return `pop-${i}`; })
		.append('h1')
		.text((d, i) => { return `Поколение ${i}:`; });
	for (let i = 0; i < population.length; ++i) {
		d3.select(`.pop-${i}`)
			.selectAll('div')
			.append('ul')
			.data(population[i])
			.enter()
			.append('li')
			.html((d) => {
				return `${entity_length(d)}: ${JSON.stringify(det_time(d))}`;
			})
			.on('click', function (d) {
				document.getElementById('win-stat').style.display='none';
				draw(d);
			});
	}
}


function regen() {
	populate();
	draw_stat();
	let s = _.min(_.last(population), (p) => { return entity_length(p); });
	draw(s);
	console.log(s);
	console.log(JSON.stringify(_.map(s, _.last)));
	console.log(entity_length(s));
}

// TODO less chaos, please
function populate() {
	let generation = [];
	let genome = [];
	let fits = [];
	let xover = (a, b) => { return (a & ~127) | (b & 127); };
	let mutate = (a) => {
		let m = 0;
		for (let i = 0; i < 5; ++i) {
			m = m | (2**_.random(0,16))
		}
		console.log(`mutant: ${m}`);
		return a^m;
	};
	const POP_SIZE = 10;

	population = [];
	for (let i = 0; i < POP_SIZE; ++i) {
		genome.push(_.random(0, Number.MAX_SAFE_INTEGER));
	}
	for (let i = 0; i < 10; ++i) {
		console.log(`genome: ${JSON.stringify(genome)}`);
		generation = _.map(genome, (g) => { return create(g); });
		fits = _.map(generation, (g) => { return entity_length(g); })
		console.log(`fits: ${JSON.stringify(fits)}`);
		let ngen = [];
		for (let j = 0; j < POP_SIZE/2; ++j) {
			ngen.push(xover(genome[j], genome[j+POP_SIZE/2]));
		}
		while (ngen.length !== 0) {
			genome[_.random(0, POP_SIZE-1)] = mutate(ngen.pop());
		}
		population.push(generation);
	}
}

/* genome is an 32-bit integer value, each bit is a gene. Genes are used to 
 * make binary decisions every time we need it. */
function create(genome) {
	/* list of unused details */
	let unused = _.range(5);
	/* list of idle workers */
	let idle = _.range(MAX_WORKER+1);
	/* copy is made not to corrupt the initial data */
	let tasks = JSON.parse(JSON.stringify(norms_list));
	/* here we store our solution: every index is a worker's number. Tasks are
	 * stored as [detail, time], where detail = -1 when worker stays idle */
	/* don't you look at me like that! It's just a 8 empty lists generator */
	let schedule = (() =>
		{
			let a = [];
			for (let i = 0; i <= MAX_WORKER; ++i) a.push([]);
			return a;
		})();

	/* debug value to track a number of gene uses */
	let _uses = 0;

	let _step = 0;
	while (!tasks_empty(tasks) && _step < 200) {
		++_step;
		//console.log(`====${_step}====`);

		/* handling empty task lists */
		let avaliable_det = _.range(tasks.length);
		for (let t in tasks) {
			if (tasks[t].length === 0) {
				unused = _.without(unused, parseInt(t));
				avaliable_det = _.without(avaliable_det, parseInt(t));
			}
		}
		//console.log(`unused: ${JSON.stringify(unused)}`);

		/* load new tasks */
		let in_use = [];
		for (let det in unused) {
			let [u, t] = _.last(
				tasks[
					unused[det]
				]
			);
			/* get all the idle workers in the current unit */
			let ws = _.intersection(units[u], idle);
			let w;
			/* everyone is busy w/ some other stuff */
			if (ws.length == 0) {
				continue;
			} else if (ws.length == 1) {
				w = ws[0];
			} else {
				/* it's only 0 or 1. Pretty useful, isn't it? */
				w = ws[genome & 1];
				genome >>= 1;
				++_uses;
			}
			schedule[w].push([parseInt(unused[det]), t]);
			idle = _.without(idle, w);
			//unused = _.without(unused, unused[det]);
			in_use.push(unused[det]);
		}
		unused = _.difference(unused, in_use);

		/* add idle tasks */
		/* when there is no task for worker it stays idle until some work is
		 * finished */
		//let used_tasks = cut(_.map(tasks, _.last), unused);
		/* we can step right to the next finished task */


		let time_step = 0;
		let diff = _.difference(avaliable_det, unused);
		if (diff.length !== 0) {
			time_step = _.min(_.map(
				_.map(cut(tasks, diff), _.last), (l) => { return l[1]; }
			))
		}
		//console.log(`time_step: ${time_step}`);
		for (let w in idle) {
			if (schedule[idle[w]].length == 0 ||
					_.last(schedule[idle[w]])[0] != IDLE) {
				schedule[idle[w]].push([IDLE, time_step]);
			} else {
				schedule[idle[w]][schedule[idle[w]].length-1][1] += time_step;
			}
		}
		
		/* time step happens for tasks: we need to substract time from pending
		 * tasks, then remove completed ones */

		//console.log(`\ncurrent tasks: ${JSON.stringify(_.map(tasks, _.last))}`);
		//console.log(`current schedule: ${JSON.stringify(_.map(schedule, _.last))}`);
		//console.log(`unused: ${JSON.stringify(unused)}, busy: ${5 - unused.length}`);
		//console.log(`idle: ${JSON.stringify(idle)}, busy: ${8 - idle.length}`);
		/* remove finished tasks */
		for (let av in avaliable_det) {
			det = avaliable_det[av];
			det = parseInt(det);
			/* substract time from details being used only */
			if (unused.indexOf(det) >= 0) continue;
			/* on your knees before its succinctness JavaScript! */
			tasks[det][tasks[det].length-1][1] -= time_step;
			/* when the task is completed feel free to remove it */
			if (tasks[det][tasks[det].length-1][1] <= 0) {
				/* normally, it cannot be < 0 */
				if (tasks[det][tasks[det].length-1][1] < 0) {
					console.warn('Just stepped some extra time. 0_o');
				}
				/* actual task removal */
				[u, time] = tasks[det].pop();
				/* set detail back to unused */
				unused.push(det);
				//console.log(`DROPPING ${det}`);
				/* and worker back to idle (yeah, a bit tricky and doesn's work -_-) */
				let ws = units[u];

				let whoa = true;
				for (let w in ws) {
					if (_.last(schedule[ws[w]])[0] == det) {
						idle.push(ws[w]);
						whoa = false;
						break;
					}
				}
				if (whoa) console.warn('Dropped a detail, but not a worker. 0_o');
			}
		} // for det in tasks
	} // while
	console.log(`\nComplete. Genome was used ${_uses} times.`);
	return schedule;
}

function entity_length(sch) {
	return _.max(_.map(sch, (line) => {
		return _.reduce(line, (a, b) => {
			return a + b[1];
		}, 0);
	}));
}

function row_length(row, ign) {
	let sum = _.reduce(row, (a, b) => { return a + b[1]; }, 0);
	//if (_.last(row)[0] < 0) { sum -= _.last(row)[1]; }
	for (let i = row.length - 1; i >= 0; --i) {
		if (row[i][0] < 0 || ign.indexOf(row[i][0]) >= 0) {
			sum -= row[i][1];
		} else break;
	}
	return sum;
}

function det_time(schedule) {
	let t = _.map(norms_list, () => { return 0; });
	let ignore = [];
	for (let i = 0; i < t.length; ++i) {
		let lens = _.map(schedule, (d) => {
			return row_length(d, ignore);
		})
		let idx = lens.indexOf(_.max(lens));
		let el = _.last(_.filter(schedule[idx], (d) => {
			return d[0] >= 0 && ignore.indexOf(d[0]) < 0;
		}))
		t[el[0]] = lens[idx];
		ignore.push(el[0]);
	}
	return t;
}

function tasks_empty(tasks) {
	for (let i in tasks) {
		if (tasks[i].length !== 0) return false;
	}
	return true;
}

/* returns only idxx-th elements or arr */
function cut(arr, idxx) {
	let res = [];
	for (let i in arr) {
		/* а здесь, леди и джентельмены, мы с вами видим parseInt. "Какого
		 * хрена?", спросите вы. И правда, какого?.. */
		if (idxx.indexOf(parseInt(i)) < 0) continue;
		res.push(arr[i]);
	}
	return res;
}

function days(n) {
	let i = n%10;
	if (i === 1 && parseInt(n/10) !== 1) return 'день';
	if (i >= 2 && i < 5 && parseInt(n/10) !== 1) return 'дня';
	return 'дней';
}
