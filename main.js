// PROJETO DE COMPUTAÇÃO GRÁFICA - Jader Abreu e Rute Maxsuelly (2018)
// Path Tracing with Ray sorting

//Chamadas do Canvas
function main(nprocessos, interacaoPorSegundos, width, height){
    if(typeof(Worker) == 'undefined') {
        alert('Seu navegador não suporta este arquivo');
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

      // Retorna uma normal randomica utilizando o algoritimo de roleta russa (OLHAR);**
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
              var c = distancia.produtoEscalar(distance) - this.raioAoQuadrado;
              var d = b*b - c;
              return d > 0 ? -b - Math.sqrt(d) : -1;
          },
          getNormal: function(ponto) {
              return ponto.subtracao(this.centro).normalizar();
          }
      };

      var Material = function(cor, emissao) {
          this.cor = cor;
          this.emissao = emissao || new Vetor(0.0, 0.0, 0.0);
      }
      Material.prototype = {
          contatoDaQueda: function(ray, normal) {
              return getNormalRandomica(normal);
          }
      };

      var Cromado = function(cor) {
          Material.call(this, cor);
      }
      Cromado.prototype = heranca({}, Material.prototype, {
          contatoDaQueda: function(ray, normal) {
              var angulo1 = Math.abs(ray.direcao.produtoEscalar(normal));
              return ray.direcao.adicao(normal.multiplicacaoValor(angulo1*2.0));
          }
      });

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
                  var indiceExterno = 1.0;
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
              // refraction
              return (ray.direcao.adicao(normal.multiplicacaoValor(angulo1)).multiplicacaoValor(eta).adicao(normal.multiplicacaoValor(-angulo2)));
              //return ray.direction.multiplicacaoValor(eta).subtracao(normal.multiplicacaoValor(angulo2-eta*angulo1));
          }
      });

      var Corpo = function(forma, material) {
          this.forma = forma;
          this.material = material;
      }

      var Renderizador = function(cena) {
          this.cena = cena;
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
		  //***** OLHAR
          iterar: function() {
              var cena = this.cena;
              var w = cena.saida.width;
              var h = cena.saida.height;
              var i = 0;
              // randomly jitter pixels so there is no aliasing
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
              // tracar no more than 5 contatoDaQuedas
              if(n > 4) {
                  return new Vetor(0.0, 0.0, 0.0);
              }
			  //Compara com a linha do infinito e a interse��o com o objeto mais pr�ximo;
              var alvo = null;
              for(var i = 0; i < this.cena.objetos.length;i++){
                  var objeto = this.cena.objetos[i];
                  var toque = objeto.forma.intersecao(ray);
                  if(toque > 0 && toque <= pontoDeAtaque) {
                      pontoDeAtaque = t;
                      alvo = objeto;
                  }
              }

              if(alvo == null) {
                  return new Vetor(0.0, 0.0, 0.0);
              }

              var ponto = ray.origem.adicao(ray.direcao.multiplicacaoValor(pontoDeAtaque));
              var normal = alvo.forma.getNormal(ponto);
              var direcao = alvo.material.contatoDaQueda(ray, normal);
              // if the ray is refractedmove the intersecaoion point a bit in
              if(direcao.produtoEscalar(ray.direcao) > 0.0) {
                  ponto = ray.origem.adicao(ray.direcao.multiplicacaoValor(pontoDeAtaque*1.0000001));
              }
              // otherwise move it out to prevent problems with floating point
              // accuracy
              else {
                  ponto = ray.origem.adicao(ray.direcao.multiplicacaoValor(pontoDeAtaque*0.9999999));
              }
              var novoRay = {origem: ponto, direcao: direcao};
              return this.tracar(novoRay, n+1).multiplicacaoVetor(alvo.material.cor).adicao(alvo.material.emissao);
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
                  // glowing sphere
                  //new Corpo(new Sphere(new Vetor(0.0, 3.0, 0.0), 0.5), new Material(new Vetor(0.9, 0.9, 0.9), new Vetor(1.5, 1.5, 1.5))),
                  // textura Vidro sphere
                  new Corpo(new Esfera(new Vetor(1.0, 2.0, 0.0), 0.5), new Vidro(new Vetor(1.00, 1.00, 1.00), 1.5, 0.1)),
                  // textura Cromado Esfera
                  new Corpo(new Esfera(new Vetor(-1.1, 2.8, 0.0), 0.5), new Cromado(new Vetor(0.8, 0.8, 0.8))),
                  // floor
                  new Corpo(new Esfera(new Vetor(0.0, 3.5, -10e6), 10e6-0.5), new Material(new Vetor(0.9, 0.9, 0.9))),
                  // back
                  new Corpo(new Esfera(new Vetor(0.0, 10e6, 0.0), 10e6-4.5), new Material(new Vetor(0.9, 0.9, 0.9))),
                  // left
                  new Corpo(new Esfera(new Vetor(-10e6, 3.5, 0.0), 10e6-1.9), new Material(new Vetor(0.9, 0.5, 0.5))),
                  // right
                  new Corpo(new Esfera(new Vetor(10e6, 3.5, 0.0), 10e6-1.9), new Material(new Vetor(0.5, 0.5, 0.9))),
                  // top light, the emmision should be close to that of warm sunlight (~5400k)
                  new Corpo(new Esfera(new Vetor(0.0, 0.0, 10e6), 10e6-2.5), new Material(new Vetor(0.0, 0.0, 0.0), new Vetor(1.6, 1.47, 1.29))),
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

      emMensagem = function(mensagem) {
          var dado = mensagem.dado;
          var serialize = false;
          // Usamos Json para trocar mensagens com os processadores
          if(typeof(dado) == 'string') {
              dado = JSON.parse('['+dado+']');
              serialize = true;
          }
          main(dado[0], dado[1], dado[2], serialize);
      }
    }
    // This is in case of normal worker start
    // "window" is not defined in web worker
    // so if you load this file directly using `new Worker`
    // the worker code will still execute properly
    if(window!=self)
      funcao_processamento();

    var processadores_Paralelos = [];
    for(i = 0; i < nprocessos;i++){
        var processador_Paralelo = new Worker(URL.createObjectURL(new Blob(["("+funcao_processamento.toString()+")()"], {type: 'text/javascript'})));
        processador_Paralelo.emMensagem = function(message) {
            interacoes += interacaoPorMensagens;
            var tempoDecorrido = new Date()-inicio;
            document.title = interacoes + ' i - ' + Math.round(interacoes*100000/tempoDecorrido)/100  + ' i/s';
            var dado = message.dado;
            if(typeof(dado) == 'string') {
                dado = JSON.parse(dado);
            }
            for(var j = 0; j < dado.length; j++) {
                buffer[j] += dado[j];
            }
            for(var k=0,j=0;k < width*height*4;) {
                imagem.dado[k++] = buffer[j++]*255/interacoes;
                imagem.dado[k++] = buffer[j++]*255/interacoes;
                imagem.dado[k++] = buffer[j++]*255/interacoes;
                imagem.dado[k++] = 255;
            }
            contexto.putImageData(imagem, 0, 0);
        }
        processador_Paralelo.postMessage([width, height, interacaoPorMensagens]);
    }


}
