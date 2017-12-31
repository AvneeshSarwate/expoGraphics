void main () {
    vec2 stN = uvN();
    
    float timex = time / 5.; // + mouse.x / resolution.x + mouse.y / resolution.y;

    stN = rotate(vec2(0.5+sin(timex)*0.5, 0.5+cos(timex)*0.5), stN, sin(timex));
    
    vec2 segGrid = vec2(floor(stN.x*30.0 * sin(timex/7.)), floor(stN.y*30.0 * sin(timex/7.)));

    vec2 xy;
    float noiseVal = rand(stN)*sin(timex/7.) * 0.15;
    if(mod(segGrid.x, 2.) == mod(segGrid.y, 2.)) xy = rotate(vec2(sin(timex),cos(timex)), stN.xy, timex + noiseVal);
    else xy = rotate(vec2(sin(timex),cos(timex)), stN.xy, - timex - noiseVal);
    
    float section = floor(xy.x*30.0 * sin(timex/7.));
    float tile = mod(section, 2.);

    float section2 = floor(xy.y*30.0 * cos(timex/7.));
    float tile2 = mod(section2, 2.);
    
    float timexMod = timex - (1. * floor(timex/1.));

    gl_FragColor = vec4(tile, tile2, timexMod, 1);
}