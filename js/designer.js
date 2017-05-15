const width = 1000;
const height = 700;

const svg = d3.select('body').append('svg')
  .attr('width', width)
  .attr('height', height);

const simulation = d3.forceSimulation()
  .force('link', d3.forceLink().id(d => d.id).distance(d => 80))
  .force('charge', d3.forceManyBody().strength(-10))
  .force('center', d3.forceCenter(width / 2 , height / 2))
  .force('collide', d3.forceCollide().radius(d => d.radius));

let g_graph;
function gogo (graph) {
  let node, link, prop;

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
  [graph.nodes, graph.properties].forEach(set => {
    set.forEach(n => {
      n.userEnabled = false;

      n.enable = () => n.userEnabled = true;
      n.disable = () => n.userEnabled = false;
      n.toggle = () => n.userEnabled ? n.disable() : n.enable();

      n.x = width / 2;
      n.y = height / 2;

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


  });

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


    prop.attr('display', n => n.visible ? '' : 'none');

    prop.selectAll('circle')
      .attr('fill', n => `rgba(${getColor(n)}, ${getAlpha(n)})`);

    prop.selectAll('text')
      .attr('fill', n => `rgba(0, 0, 0, ${getAlpha(n)})`);

    prop.selectAll('.ring')
      .attr('fill', 'none')
      .attr('stroke', n => `rgba(${getColor(n)}, ${n.userEnabled ? 1.0 : 0.0})`);

    link.attr('display', l => l.source.enabled ? '' : 'none');
    link.attr('stroke-width', 2);
  }

  function ticked() {
    node.attr('transform', d => `translate(${d.x}, ${d.y})`);
    prop.attr('transform', d => {
      if (d.hasOwnProperty('x') && d.hasOwnProperty('y')) {
        return `translate(${d.x}, ${d.y})`;
      }
    });

    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
  }

  function createLinks() {
    graph.links = [];
    [graph.nodes, graph.properties].forEach(set => {
      set.forEach(n => {
        if (n.enabled) {
          n.properties.forEach(prop => {
            const target = [...graph.nodes, ...graph.properties].find(n => n.id === prop);
            if (target !== undefined) {
              graph.links.push({
                source: n,
                target
              });
            }
          });
        }
      });
    });
  }

  function restart() {
    if (node !== undefined) {
      node.remove();
    }

    node = svg.append('g')
        .attr('class', 'nodes')
      .selectAll('circle')
      .data(graph.nodes)
      .enter().append('g')
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

    if (prop !== undefined) {
      prop.remove();
    }

    prop = svg.append('g')
        .attr('class', 'properties')
      .selectAll('circle')
      .data(graph.properties)
      .enter().append('g')
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

    graph.properties.forEach(p => {
      if (p.type === 'property') {
        const parent = graph.nodes.find(gn => gn.properties.includes(p.id));
        console.log(parent.x);
        console.log(parent);
      }
    });

    if (link !== undefined) { link.remove(); }
    createLinks();
    link = svg.append('g')
        .attr('class', 'links')
      .selectAll('line')
      .data(graph.links)
      .enter().append('line');

    simulation
      .nodes([...graph.nodes, ...graph.properties].filter(n => n.visible))
      .on('tick', ticked);

    simulation.force('link')
      .links(graph.links);

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
      restart();
    });

    prop.append('circle')
      .attr('r', d => d.radius);

    prop.append('circle')
      .attr('r', d => d.radius * 1.1)
      .classed('ring', true);

    prop.append('text')
      .attr('dx', 12)
      .attr('dy', 20)
      .text(d => d.id.replace(/_/g, ' '));

    prop.on('click', d => {
      if (d.disabled) { return; }
      d.toggle();
      restart();
    });

    render();
  }

  restart();

}

d3.json('data/numbers.json', (error, graph) => {
  if (error) { throw error; }
  gogo(graph);
  g_graph = graph;
});
