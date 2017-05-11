const width = 1000;
const height = 700;

const svg = d3.select('body').append('svg')
  .attr('width', width)
  .attr('height', height);

const simulation = d3.forceSimulation()
  .force('link', d3.forceLink().id(d => d.id))
  .force('charge', d3.forceManyBody())
  .force('center', d3.forceCenter(width / 2 , height / 2));

let g_graph;
function render (graph) {
  function dragstarted(d) {
    if (!d3.event.active) { simulation.alphaTarget(0.3).restart(); }
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) { simulation.alphaTarget(0); }
    d.fx = null;
    d.fy = null;
  }

  // set up objects
  graph.nodes.forEach(n => {
    n.active = false;
    n.disabledBy = [];
    Object.defineProperty(n, 'disabled', {get: () => n.disabledBy.length > 0});
  });


  const node = svg.append('g')
      .attr('class', 'nodes')
    .selectAll('circle')
    .data(graph.nodes)
    .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

  node.attr('active', false)
      .attr('disabled', false);

  function updateCircles() {
    const getAlpha = d => d.active ? 1.0 : d.disabled ? 0.1 : 0.5;
    node.selectAll('circle')
      .attr('fill', d => `rgba(43, 156, 212, ${getAlpha(d)})`);
    node.selectAll('text')
      .attr('fill', d => `rgba(0, 0, 0, ${getAlpha(d)})`);
  }

  node.append('circle')
    .attr('r', 10);

  updateCircles();

  node.append('text')
    .attr('dx', 12)
    .attr('dy', 20)
    .text(d => d.id);

  node.on('click', d => {
    d.active = !d.active;
    graph.nodes.filter(n => d.disables.includes(n.id)).forEach(toDisable => {
      const action = d.active ? 'push' : 'remove';
      if (d.active) { toDisable.disabledBy.push(d.id); }
      else { toDisable.disabledBy.splice(toDisable.disabledBy.findIndex(v => v === d.id), 1); }
    });
    updateCircles();
  });


  function ticked() {
    node.attr('transform', d => `translate(${d.x}, ${d.y})`);
  }

  simulation
    .nodes(graph.nodes)
    .on('tick', ticked);

  // simulation.force('link')
  //   .links(graph.links);


}

d3.json('data/numbers.json', (error, graph) => {
  if (error) { throw error; }
  render(graph);
  g_graph = graph;
});
