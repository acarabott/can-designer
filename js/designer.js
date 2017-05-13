const width = 1000;
const height = 700;

const svg = d3.select('body').append('svg')
  .attr('width', width)
  .attr('height', height);

const simulation = d3.forceSimulation()
  .force('link', d3.forceLink().id(d => d.id).distance(d => 80))
  .force('charge', d3.forceManyBody())
  .force('center', d3.forceCenter(width / 2 , height / 2))
  .force('collide', d3.forceCollide().radius(d => d.radius));

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

  graph.links = [];

  // set up objects
  graph.nodes.forEach(n => {
    n.userEnabled = false;

    n.enable = () => n.userEnabled = true;
    n.disable = () => n.userEnabled = false;
    n.toggle = () => n.userEnabled ? n.disable() : n.enable();

    n.properties.forEach(prop => graph.links.push({
      source: n.id,
      target: prop
    }));

    Object.defineProperties(n, {
      visible: {
        get: () => {
          if (['1', '2'].includes(n.type)) { return true; }
          return graph.nodes
            .filter(node => node.properties.includes(n.id))
            .some(node => node.enabled);
        }
      },
      enabled: {
        get: () => {
          return n.userEnabled || n.enabledBy.some(ids => {
            return graph.nodes
              .filter(node => ids.includes(node.id))
              .every(node => node.enabled);
          });
        }
      },
      disabled: {
        get: () => {
          return n.disabledBy.some(ids => {
            return graph.nodes
              .filter(node => ids.includes(node.id))
              .every(node => node.enabled);
          });
        },
      },
      radius: {
        get: () => {
          const radii = {
            1: 50,
            2: 40,
            property: 20
          };

          return radii[n.type];
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

  const link = svg.append('g')
      .attr('class', 'links')
    .selectAll('line')
    .data(graph.links)
    .enter().append('line');

  function render() {
    const getAlpha = n => n.enabled ? 1.0 : n.disabled ? 0.1 : 0.5;
    const getColor = n => {
      const colors = {
        blue: [43, 156, 212],
        red: [212, 100, 100],
        orange: [249, 182, 118],
        green: [43, 212, 156],
        grey: [89, 125, 148],
      };
      const lookup = { 1: 'blue', 2: 'green', property: 'orange', 4: 'grey', 5: 'red' };
      return colors[lookup[n.type]].join(',');
    };

    node.attr('display', n => n.visible ? '' : 'none');

    node.selectAll('circle')
      .attr('fill', n => `rgba(${getColor(n)}, ${getAlpha(n)})`);

    node.selectAll('text')
      .attr('fill', n => `rgba(0, 0, 0, ${getAlpha(n)})`);

    node.selectAll('.ring')
      .attr('fill', 'none')
      .attr('stroke', n => `rgba(${getColor(n)}, ${n.userEnabled ? 1.0 : 0.0})`);

    link.attr('display', l => l.source.enabled ? '' : 'none');
    link.attr('stroke-width', 2);
  }

  node.append('circle')
    .attr('r', d => d.radius);

  node.append('circle')
    .attr('r', d => d.radius * 1.1)
    .classed('ring', true);

  node.append('text')
    .attr('dx', 12)
    .attr('dy', 20)
    .text(d => d.id.replace(/_/g, ' '));

  node.on('click', d => {
    if (d.disabled) { return; }
    d.toggle();
    render();
  });

  function ticked() {
    node.attr('transform', d => `translate(${d.x}, ${d.y})`);

    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    // link.distance(d => 1000);
  }

  simulation
    .nodes(graph.nodes)
    .on('tick', ticked);

  simulation.force('link')
    .links(graph.links);

  render();
}

d3.json('data/numbers.json', (error, graph) => {
  if (error) { throw error; }
  render(graph);
  g_graph = graph;
});
