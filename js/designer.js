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
    n._enabled = false;
    n.disabledBy = [];
    n.enabledBy = [];

    // convert list of ids to enable/disable into actual object references
    ['enables', 'disables'].forEach(l => {
      n[`${l}Objs`] = n[l].map(id => graph.nodes.find(m => m.id === id));
    });

    n.update = () => {
      if (n.enabled) {
        n.enablesObjs.forEach(o => o.enabledAdd(n));
        n.disablesObjs.forEach(o => o.disabledAdd(n));
      }
      else {
        n.enablesObjs.forEach(o => o.enabledRemove(n));
        n.disablesObjs.forEach(o => o.disabledRemove(n));
      }
    };

    n.enable = () => {
      n._enabled = true;
      n.update();
    };

    n.disable = () => {
      n._enabled = false;
      n.update();
    };

    n.toggle = () => {
      n._enabled ? n.disable() : n.enable();
    };

    n.disabledAdd = d => {
      if (n.disabledBy.indexOf(d.id) !== -1) { return; }
      n.disabledBy.push(d.id);
      n.update();
    };

    n.disabledRemove = d => {
      if (n.disabledBy.length === 0) { return; }
      const index = n.disabledBy.findIndex(v => v === d.id);
      if (index === -1) { return; }
      n.disabledBy.splice(index, 1);
      n.update();
    };

    n.enabledAdd = d => {
      if (n.enabledBy.indexOf(d.id) !== -1) { return; }
      n.enabledBy.push(d);
      n.update();
    };

    n.enabledRemove = d => {
      if (n.enabledBy.length === 0) { return; }
      const index = n.enabledBy.findIndex(v => v === d.id);
      if (index === -1) { return; }
      n.enabledBy.splice(index, 1);
      n.update();
    };

    Object.defineProperties(n, {
      disabled: {
        get: () => {
          if (n.enabledBy.length !== 0) { return false; }
          const notEnabled = n.enabledBy.length === 0;
          const haveDisabled = n.disabledBy.length > 0;
          const comboDisabled = n.disabledByCombos.some(combo => {
            return graph.nodes
              .filter(node => combo.includes(node.id))
              .every(node => node.enabled);
          });
          return haveDisabled || comboDisabled;
        },
      },
      enabled: {
        get: () => {
          if (n.disabledBy.length !== 0) { return false; }
          const notDisabled = n.disabledBy.length === 0;
          const userEnabled = n._enabled;
          const haveEnabled = n.enabledBy.length > 0;
          const comboEnabled = n.enabledByCombos.some(combo => {
            return graph.nodes
              .filter(node => combo.includes(node.id))
              .every(node => node.enabled);
          });
          return userEnabled || haveEnabled || comboEnabled;
        }
      }
    });
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

  function updateCircles() {
    const getAlpha = d => d.enabled ? 1.0 : d.disabled ? 0.1 : 0.5;
    node.selectAll('circle')
      .attr('fill', d => `rgba(43, 156, 212, ${getAlpha(d)})`);

    node.selectAll('text')
      .attr('fill', d => `rgba(0, 0, 0, ${getAlpha(d)})`);

    node.selectAll('.ring')
      .attr('fill', 'none')
      .attr('stroke', d => `rgba(43, 156, 212, ${d._enabled ? 1.0 : 0.0})`);
  }

  node.append('circle')
    .attr('r', 40);

  node.append('circle')
    .attr('r', 50)
    .classed('ring', true);

  updateCircles();

  node.append('text')
    .attr('dx', 12)
    .attr('dy', 20)
    .text(d => d.id);

  node.on('click', d => {
    if (d.disabled) { return; }

    d.toggle();
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
