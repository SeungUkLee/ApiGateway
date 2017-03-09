function matcher(url, dest) {
  // 먼저, URL을 정규식으로 바꾼다.
  // NOTE: 사용자 입력을 정규 표현식으로 직접 변환하는 것은 안전하지 않다.
  var r = new RegExp(url.replace(/\//, '\\/'));
  // 이 다음 코드 블록은 약간 혼란스럽게 보일 수 있음.... ㅜㅠㅠ
  // 일치시킬 각 URL에 대한 클로저 (익명 함수)를 반환하고,
  // 각 요청에 대해 URL이 일치하는 경우 배열에 저장
  // 함수가 저장되면 함수가 호출됩니다.
  console.log('matcher function!');
  return function(url) {
    var m = r.exec(url);
    console.log('m : ', m);
    if(!m) {
      return;
    }
    // keep the path as we want to change only the domain
    var path = url;

    console.log('proxy:', url, '->', dest);
    return {url : path, dest : dest};
  };
}

module.exports = function(urls) {
  // 미들웨어 진입점
  // 'matchers'는 위에서 언급 한 것처럼 URL matchers의 배열입니다.
  var matchers = [];
  for (var url in urls) {
    // 위의 'matcher'함수를 호출하고 결과로 얻은 클로저를 저장합니다.
    console.log('url : ', url);
    console.log('urls : ', urls);
    console.log('matcher(url, urls[url]) : ', matcher(url, urls[url]) );
    matchers.push(matcher(url, urls[url]));
    console.log('urls[url] : ', urls[url]);
    console.log('matchers type : ', typeof matchers);
    //console.log('matchers : ', matchers);
  }
  console.log('hh');
  // 이 클로저는 request handler로 반환됩니다.
  return function(req, res, next) {
    // in node-http-proxy middlewares, `proxy` is the prototype of `next`
    // (this means node-http-proxy middlewares support both the connect API (req, res, next)
    // and the node-http-proxy API (req, res, proxy)
    var proxy = next;
      // for each URL matcher, try the request's URL.
    for(var k in matchers) {
      var m = matchers[k](req.url);
      console.log('m : ',m);
      // If it's a match:
      if (m) {
        // local URL 을 목적지 URL로 바꾼다.
        console.log('If it is match');
        req.url = m.url;
        // 만약 다른 도메인에있는 서버로 라우팅하는 경우 request의 hostname을 변경해야한다.
        //req.headers['x-host'] = process.env.LELYLAN_PROXY_URL;
        req.headers['x-host'] = 'localhost';
        req.headers.host = m.dest.host;

        //일단 변경 사항이 처리되면 이 행은 마법같은 일??이 일어난다.
        console.log('m.dest : ',m.dest);
        return proxy.proxyRequest(req, res, m.dest);
      }
    }
    // 일치하는 경로가 없으면 default redirect
    // 복제 된 코드의이 부분을 리팩토링합니다. (리펙토링 : 결과의 변경 없이 코드의 구조를 재조정함)
    // var m = {url : '/devices', dest : {port : porcess.env.LELYLAN_DEVICES_PORT || 80, host : process.env.LELYLAN_DEVICES_URL}}

    var m = {url : '/devices', dest : {host : '52.79.198.44', port : 8006 }};

    req.url = m.url;
    //req.headers['x-host'] = process.env.LELYLAN_PROXY_URL;
    req.headers['x-host'] = 'localhost';
    req.headers.host = m.dest.host;

    return proxy.proxyRequest(req, res, m.dest);
  };
};
