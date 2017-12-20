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

/* unit is for unit number (not unique), ops is a result */
/*let schedule = [
	{ 'unit': 1, 'ops': []},
	{ 'unit': 1, 'ops': []},
	{ 'unit': 2, 'ops': []},
	{ 'unit': 2, 'ops': []},
	{ 'unit': 3, 'ops': []},
	{ 'unit': 3, 'ops': []},
	{ 'unit': 4, 'ops': []},
	{ 'unit': 5, 'ops': []},
];*/

/* numbers of workers, associated with particular units */
const units = [[0,1], [2,3], [4,5], [6], [7]];
const MAX_WORKER = 7;
const IDLE = -1;

function init() {
	let s = create(30);
	console.log(s);
}

/* genome is an 32-bit integer value, each bit is a gene. Genes are used to 
 * make binary decisions every time we need it. */
function create(genome) {
	/* list of unused details */
	let unused = _.range(5);
	/* list of idle workers */
	let idle = _.range(MAX_WORKER+1);
	/* copy is made not to corrupt the initial data */
	let tasks = Object.assign([], norms_list);
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
		console.log(`${tasks_empty(tasks)}`);
		++_step;
		console.log(`====${_step}====`);
		//console.log(`current tasks: ${JSON.stringify(_.map(tasks, _.last))}`);
		//console.log(`unused: ${JSON.stringify(unused)}, busy: ${5 - unused.length}`);
		//console.log(
			//`\ncurrent schedule: ${JSON.stringify(_.map(schedule, _.last))}`
		//);
		//console.log(`idle: ${JSON.stringify(idle)}, busy: ${8 - idle.length}`);

		/* handling empty task lists */
		let avaliable_det = _.range(tasks.length);
		for (let t in tasks) {
			if (tasks[t].length === 0) {
				unused = _.without(unused, parseInt(t));
				avaliable_det = _.without(avaliable_det, parseInt(t));
			}
		}
		console.log(`unused: ${JSON.stringify(unused)}`);

		/* load new tasks */
		let in_use = [];
		for (let det in unused) {
			//console.log(`tasks: ${JSON.stringify(tasks)}`);
			//console.log(`unused: ${JSON.stringify(unused)}, det: ${det}`);
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

		//console.log(`${JSON.stringify(avaliable_det)} - ${JSON.stringify(unused)} = ${JSON.stringify(_.difference(avaliable_det, unused))}`);

		let time_step = 0;
		let diff = _.difference(avaliable_det, unused);
		if (diff.length !== 0) {
			time_step = _.min(_.map(
				_.map(cut(tasks, diff), _.last), (l) => { return l[1]; }
			))
		}
		console.log(`time_step: ${time_step}`);
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

		console.log(`\ncurrent tasks: ${JSON.stringify(_.map(tasks, _.last))}`);
		console.log(`current schedule: ${JSON.stringify(_.map(schedule, _.last))}`);
		console.log(`unused: ${JSON.stringify(unused)}, busy: ${5 - unused.length}`);
		console.log(`idle: ${JSON.stringify(idle)}, busy: ${8 - idle.length}`);
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
				//console.log(tasks[det][tasks[det].length-1]);
				//console.log(JSON.stringify(tasks[det][tasks[det].length-1]));
				[u, time] = tasks[det].pop();
				/* set detail back to unused */
				unused.push(det);
				console.log(`DROPPING ${det}`);
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
	return {'sched': schedule, 'tasks': tasks};
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
