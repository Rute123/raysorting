// PROJETO DE COMPUTAÇÃO GRÁFICA - Jader Abreu e Rute Maxsuelly (2018)
// Path Tracing with Ray sorting

//Chamadas do Canvas
function main(nprocessos, interacaoPorMensagens, width, height){
    if(typeof(Worker) == 'undefined') {
        alert('Seu navegador não suporta este multiprocessos');
        return;
    }

    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.position = 'absolute';
    canvas.margin = 'auto';
    var contexto = canvas.getContext('2d');
    document.body.appendChild(canvas);
    var imagem = contexto.getImageData(0, 0, width, height);
    var buffer = [];
    var interacoes = 0;
    var inicio = new Date();
    for(var i = 0; i < width*height*3; i++) {
        buffer.push(0.0);
    }

//Worker OLHAR e tirar dúvida do funcionamento
    function funcao_processamento() {

      var heranca = function(a) {
          for(var i = 1; i < arguments.length; i++) {
              var b = arguments[i];
              for(var c in b) {
                  a[c] = b[c];
              }
          }
          return a;
      }

      var Vetor = function(x, y, z) {
          this.x = x;
          this.y = y;
          this.z = z;
      }
      //Caracteristicas do Vetor
      Vetor.prototype = {
          adicao: function(v) {
              return new Vetor(this.x+v.x, this.y+v.y, this.z+v.z);
          },
          adicaoInterna: function(v) {
              this.x += v.x;
              this.y += v.y;
              this.z += v.z;
          },
          subtracao: function(v) {
              return new Vetor(this.x-v.x, this.y-v.y, this.z-v.z);
          },
          multiplicacaoVetor: function(v) {
              return new Vetor(this.x*v.x, this.y*v.y, this.z*v.z);
          },
          divisaoVetor: function(v) {
              return new Vetor(this.x/v.x, this.y/v.y, this.z/v.z);
          },
          multiplicacaoValor: function(s) {
              return new Vetor(this.x*s, this.y*s, this.z*s);
          },
          divisaoValor: function(s) {
              return this.multiplicacaoValor(1.0/s);
          },
          produtoEscalar: function(v) {
              return this.x*v.x+this.y*v.y+this.z*v.z;
          },
          normalizar: function(){
              return this.divisaoValor(Math.sqrt(this.produtoEscalar(this)));
          }
      };

      // Envia raios normais aleatorios ao ambiente
	  // Utiliza o principio de Monte Carlo: roleta russa - complementado no 'Renderizador';
      function getNormalRandomica(v){
          do {
              var v2 = new Vetor(Math.random()*2.0-1.0, Math.random()*2.0-1.0, Math.random()*2.0-1.0);
          } while(v2.produtoEscalar(v2) > 1.0);
          // Mostra apenas 1.9 interacoes em média
          v2 = v2.normalizar();
          // Se o ponto estiver na área errada, espelhe-o
          if(v2.produtoEscalar(v) < 0.0) {
              return v2.multiplicacaoValor(-1);
          }
          return v2;
      }

      /* Definicao da camera por um ponto de visao (Origem) e seu plano de projecao
       * com os cantos (superiorEsquerdo,superiorDireito,inferiorEsquerdo)
       */
      var Camera = function(origem, superiorEsquerdo, superiorDireito, inferiorEsquerdo) {
          this.origem = origem;
          this.superiorEsquerdo = superiorEsquerdo;
          this.superiorDireito = superiorEsquerdo;
          this.inferiorEsquerdo = inferiorEsquerdo;

          this.xd = superiorDireito.subtracao(superiorEsquerdo);
          this.yd = inferiorEsquerdo.subtracao(superiorEsquerdo);
      }
      Camera.prototype = {
          getRay: function(x, y) {
              // ponto no plano de tela
              var p = this.superiorEsquerdo.adicao(this.xd.multiplicacaoValor(x)).adicao(this.yd.multiplicacaoValor(y));
              return {
                  origem: this.origem,
                  direcao: p.subtracao(this.origem).normalizar()
              };
          }
      };
	  // Objetos da cena
      var Esfera = function(centro, raio) {
          this.centro = centro;
          this.raio = raio;
          this.raioAoQuadrado = raio*raio;
      };
      Esfera.prototype = {
          // Retorna distancia quando raio intersepta com a superficie da esfera
          intersecao: function(ray) {
              var distancia = ray.origem.subtracao(this.centro);
              var b = distancia.produtoEscalar(ray.direcao);
              var c = distancia.produtoEscalar(distancia) - this.raioAoQuadrado;
              var d = b*b - c;
              return d > 0 ? -b - Math.sqrt(d) : -1;
          },
          getNormal: function(ponto) {
              return ponto.subtracao(this.centro).normalizar();
          }
      };

      //Emissão Representa a intensidade da luz
      var Material = function(cor, emissao) {
          this.cor = cor;
          this.emissao = emissao || new Vetor(0.0, 0.0, 0.0);
      }
      Material.prototype = {
          contatoDaQueda: function(ray, normal) {
              return getNormalRandomica(normal);
          }
      };
	  //Reflexao especular
      var Cromado = function(cor) {
          Material.call(this, cor);
      }
      Cromado.prototype = heranca({}, Material.prototype, {
          contatoDaQueda: function(ray, normal) {
              var angulo1 = Math.abs(ray.direcao.produtoEscalar(normal));
              return ray.direcao.adicao(normal.multiplicacaoValor(angulo1*2.0));
          }
      });
	  // Reflexão difusa
	  // Considerando que o indiceDeRefracaoVidro= 1.5
      var Vidro = function(cor, indiceDeRefracao, reflexao) {
          Material.call(this, cor);
          this.indiceDeRefracao = indiceDeRefracao;
          this.reflexao = reflexao;
      }
      Vidro.prototype = heranca({}, Material.prototype, {
          contatoDaQueda: function(ray, normal) {
              var angulo1 = Math.abs(ray.direcao.produtoEscalar(normal));
              if(angulo1 >= 0.0) {
                  var indiceInterno = this.indiceDeRefracao;
                  var indiceExterno = 1.0; //indice de refracao do ar;
              }
              else {
                  var indiceInterno = 1.0;
                  var indiceExterno = this.indiceDeRefracao;
              }
              var proporcaoRefracao = indiceExterno/indiceInterno;
              var angulo2 = Math.sqrt(1.0 - (proporcaoRefracao * proporcaoRefracao) * (1.0 - (angulo1 * angulo1)));
              var rs = (indiceExterno * angulo1 - indiceInterno * angulo2) / (indiceExterno*angulo1 + indiceInterno * angulo2);
              var rp = (indiceInterno * angulo1 - indiceExterno * angulo2) / (indiceInterno*angulo1 + indiceExterno * angulo2);
              var refletancia = (rs*rs + rp*rp);
              // reflexao
              if(Math.random() < refletancia+this.reflexao) {
                  return ray.direcao.adicao(normal.multiplicacaoValor(angulo1*2.0));
              }
              // refracao
              return (ray.direcao.adicao(normal.multiplicacaoValor(angulo1)).multiplicacaoValor(proporcaoRefracao).adicao(normal.multiplicacaoValor(-angulo2)));
              //return ray.direction.multiplicacaoValor(proporcaoRefracao).subtracao(normal.multiplicacaoValor(angulo2-proporcaoRefracao*angulo1));
          }
      });

      var Corpo = function(forma, material) {
          this.forma = forma;
          this.material = material;
      }

      var Renderizador = function(cena) {
          this.cena = cena;
          this.vetoresAgrupadores = [6];
          var grupo1 = [];
          this.vetoresAgrupadores[0] = {direcaoAgrupada: new Vetor(10, 0, 0), rays: grupo1};
          this.vetoresAgrupadores[1] = {direcaoAgrupada: new Vetor(-10, 0, 0), rays: grupo1};
          this.vetoresAgrupadores[2] = {direcaoAgrupada: new Vetor(0, 10, 0), rays: grupo1};
          this.vetoresAgrupadores[3] = {direcaoAgrupada: new Vetor(0, -10, 0), rays: grupo1};
          this.vetoresAgrupadores[4] = {direcaoAgrupada: new Vetor(0, 0, 10), rays: grupo1};
          this.vetoresAgrupadores[5] = {direcaoAgrupada: new Vetor( 0, 0,-10), rays: grupo1};
          this.buffer = [];
          for(var i = 0; i < cena.saida.width*cena.saida.height;i++){
              this.buffer.push(new Vetor(0.0, 0.0, 0.0));
          }

      }
      Renderizador.prototype = {
          limparBuffer: function() {
              for(var i = 0; i < this.buffer.length; i++) {
                  this.buffer[i].x = 0.0;
                  this.buffer[i].y = 0.0;
                  this.buffer[i].z = 0.0;
              }
          },
		  //Arquivos de saida
		  // Disparo de ray a partir da camera
          iterar: function() {
              var cena = this.cena;
              var w = cena.saida.width;
              var h = cena.saida.height;
              var i = 0;
              // Jitter- Uma amostragem estratificada - amostragem aleatória - soma de integrais de Monte Carlo;
			          // Mascara o antialising nos pixels das imagens originais,
			        // Gera um sobreamento automatico devido a luz irradiante.
              for(var y = Math.random()/h, yPasso = 1.0/h; y < 0.99999; y += yPasso){
                  for(var x = Math.random()/w, xPasso = 1.0/w; x < 0.99999; x += xPasso){
                      var ray = cena.camera.getRay(x, y);
                      var cor = this.tracar(ray, 0);
                      this.buffer[i++].adicaoInterna(cor);
                  }
              }
          },
          tracar: function(ray, n) {
              var pontoDeAtaque = Infinity;
              // tracar nao mais que 5 contatoDaQueda
              if(n > 4) {
                  return new Vetor(0.0, 0.0, 0.0);
              }
			  //Compara com a linha do infinito e a intersecao com o objeto mais proximo;
              var alvo = null;
              for(var i = 0; i < this.cena.objetos.length;i++){
                  var objeto = this.cena.objetos[i];
                  var toque = objeto.forma.intersecao(ray);
                  if(toque > 0 && toque <= pontoDeAtaque) {
                      pontoDeAtaque = toque;
                      alvo = objeto;
                  }
              }

              if(alvo == null) {
                  return new Vetor(0.0, 0.0, 0.0);
              }

              var ponto = ray.origem.adicao(ray.direcao.multiplicacaoValor(pontoDeAtaque));
              var normal = alvo.forma.getNormal(ponto);
              var direcao = alvo.material.contatoDaQueda(ray, normal);
              // Se o raio for refratado mova o ponto de intersecao
              if(direcao.produtoEscalar(ray.direcao) > 0.0) {
                  ponto = ray.origem.adicao(ray.direcao.multiplicacaoValor(pontoDeAtaque*1.0000001));
              }
              // Caso contrario mova-o para evitar problemas com o ponto flutuante
              else {
                  ponto = ray.origem.adicao(ray.direcao.multiplicacaoValor(pontoDeAtaque*0.9999999));
              }
              var novoRay = {origem: ponto, direcao: direcao};
              this.agruparSegmentos(novoRay);
              //Agrupar novoRay de acordo com a sua proximidade de diração com os eixos xd,xe,yc, yb,zt,zf
              return this.tracar(novoRay, n+1).multiplicacaoVetor(alvo.material.cor).adicao(alvo.material.emissao);
          },
          agruparSegmentos:function (ray){
            menorResultante = -1000;
            vetorAgrupar = null;
            for (var i = 0; i < this.vetoresAgrupadores.length; i++) {
              var resultante =angulo1 = Math.abs(ray.direcao.produtoEscalar(this.vetoresAgrupadores[i].direcaoAgrupada));
              if(menorResultante<resultante){
                menorResultante = resultante;
                vetorAgrupar = this.vetoresAgrupadores[i];
              }
            }
            if(vetorAgrupar != null){
              vetorAgrupar.rays.push(ray);
            }
          },
          imprimirAgrupamentosRays: function(){
            for (var i = 0; i < this.vetoresAgrupadores.length; i++) {
              console.log("Direção: " + this.vetoresAgrupadores[i].direcaoAgrupada.x + ","+ this.vetoresAgrupadores[i].direcaoAgrupada.y + ","+ this.vetoresAgrupadores[i].direcaoAgrupada.z);
              console.log("Quantidade de Raios " + this.vetoresAgrupadores[i].rays.length);
            }
          }
      }

      var main = function(width, height, interacaoPorMensagens, serialize) {
          var cena = {
              saida: {width: width, height: height},
              camera: new Camera(
                  new Vetor(0.0, -0.5, 0.0),
                  new Vetor(-1.3, 1.0, 1.0),
                  new Vetor(1.3, 1.0, 1.0),
                  new Vetor(-1.3, 1.0, -1.0)
              ),
              objetos: [
                // textura brilho esfera
                //new Corpo(new Sphere(new Vetor(0.0, 3.0, 0.0), 0.5), new Material(new Vetor(0.9, 0.9, 0.9), new Vetor(1.5, 1.5, 1.5))),
                // textura Vidro sphere
                new Corpo(new Esfera(new Vetor(1.0, 2.0, 0.0), 0.5), new Vidro(new Vetor(1.00, 1.00, 1.00), 1.5, 0.1)),
                // textura Cromado Esfera
                new Corpo(new Esfera(new Vetor(-1.1, 2.3, 0.0), 0.5), new Cromado(new Vetor(0.8, 0.8, 0.8))),
                // textura Cromado Esfera
                new Corpo(new Esfera(new Vetor(0, 2.6, 0.0), 0.5), new Cromado(new Vetor(0.8, 0.8, 0.8))),
                // chao
                new Corpo(new Esfera(new Vetor(0.0, 3.5, -10e6), 10e6-0.5), new Material(new Vetor(0.9, 0.9, 0.9))),
                // posterior
                new Corpo(new Esfera(new Vetor(0.0, 10e6, 0.0), 10e6-4.5), new Material(new Vetor(0.9, 0.9, 0.9))),
                // esquerda
                new Corpo(new Esfera(new Vetor(-10e6, 3.5, 0.0), 10e6-1.9), new Material(new Vetor(0.9, 0.5, 0.5))),
                // direita
                new Corpo(new Esfera(new Vetor(10e6, 3.5, 0.0), 10e6-1.9), new Material(new Vetor(0.5, 0.5, 0.9))),
                // Luz superior, a emissão deve estar aproximadamente da luz do sol quente (~ 5400k)
                new Corpo(new Esfera(new Vetor(0, 2.6, 10e6), 10e6-2.5), new Material(new Vetor(0,0,0), new Vetor(1.6, 1.47, 1.29))),
                // frontal
                new Corpo(new Esfera(new Vetor(0.0, -10e6, 0.0), 10e6-2.5), new Material(new Vetor(0.9, 0.9, 0.9))),
              ]
          }
          var renderizador = new Renderizador(cena);
          var buffer = [];
          while(true) {
              for(var x = 0; x < interacaoPorMensagens; x++) {
                  renderizador.iterar();
              }
              renderizador.imprimirAgrupamentosRays();
              postMessage(serializarBuffer(renderizador.buffer, serialize));
              renderizador.limparBuffer();
          }
      }

      var serializarBuffer = function(renderizadorBuffer, json) {
          var buffer = [];
          for(var i = 0; i < renderizadorBuffer.length; i++){
              buffer.push(renderizadorBuffer[i].x);
              buffer.push(renderizadorBuffer[i].y);
              buffer.push(renderizadorBuffer[i].z);
          }
          return json ? JSON.stringify(buffer) : buffer;
      }

      onmessage = function(mensagem) {
          var dados = mensagem.data;
          var serialize = false;
          // Usamos Json para trocar mensagens com os processadores
          if(typeof(dados) == 'string') {
              dados = JSON.parse('['+dados+']');
              serialize = true;
          }
          main(dados[0], dados[1], dados[2], serialize);
      }
    }
    // Play no work, sabendo que a "window" ainda nao foi definida no web Work
  	// Carrega diretamente o 'new Worker'
  	// Executa corretamente o código
      if(window!=self)
        funcao_processamento();

      var processadores_Paralelos = [];
      for(i = 0; i < nprocessos;i++){
          var processador_Paralelo = new Worker(URL.createObjectURL(new Blob(["("+funcao_processamento.toString()+")()"], {type: 'text/javascript'})));
          processador_Paralelo.onmessage = function(mensagem) {
              interacoes += interacaoPorMensagens;
              var tempoDecorrido = new Date()-inicio;
              document.getElementById("interacoes").innerHTML = ""+interacoes ;
              document.getElementById("interacoesPorSegundo").innerHTML =  ""+Math.round(interacoes*100000/tempoDecorrido)/100;
              var dados = mensagem.data;
              if(typeof(dados) == 'string') {
                  dados = JSON.parse(dados);
              }
              for(var j = 0; j < dados.length; j++) {
                  buffer[j] += dados[j];
              }
              for(var k=0,j=0;k < width*height*4;) {
                  imagem.data[k++] = buffer[j++]*255/interacoes;
                  imagem.data[k++] = buffer[j++]*255/interacoes;
                  imagem.data[k++] = buffer[j++]*255/interacoes;
                  imagem.data[k++] = 255;
              }
              contexto.putImageData(imagem, 0, 0);
          }
          processador_Paralelo.postMessage([width, height, interacaoPorMensagens]);
      }


}
