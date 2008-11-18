// ==UserScript==
// @name            Fluid Twitter ++
// @namespace       http://brionesandco.com/ryabriones
// @description     Streamline the Twitter interface to be nicer in a Fluid Instance, with ajax update, growl and dock-icon badges
// @include         http://twitter.tld/home*
// @version         0.2
// @author          Ryan Carmelo Briones (modified by Brian Anderson - banderson623@gmail.com)
// @homepage        http://brionesandco.com/ryabriones 
// ==/UserScript==

var FluidTwitterPlus = Class.create({
  // seconds_to_refresh: 60 * 5,
  seconds_to_refresh: 10,
  new_tweets_to_view: true,
  latest_growled_id: "",
  latest_seen_id: "",
  show_updates_with_growl: true,
  beep_on_update: true,
  me: "",
  debug: false,

  initialize: function() {
    this.latest_seen_id =    this.staleTweets()[2].id;
    this.latest_growled_id = this.staleTweets()[2].id;
    this.me = $$('meta[name=session-user-screen_name]').first().content;
    this.timeline_body = $$('#timeline #timeline_body')[0];
    setTimeout(this.refreshTwitter.bind(this), this.seconds_to_refresh * 1000);
    this.buildConfig();
    this.setupFakeTimeline();
    this.observeAppFocus();
    this.refreshTwitter();
  },
  
  buildConfig: function() {
    if(this.debug) this.growl("buildConfig", "building");
    var fv = '<form id="fluid_twitter_config" style="margin-top:10px;">';

        fv += '<label for="fluid_reload">Refresh every </label>';
        fv += '<select name="fluid_reload" id="fluid_reload"><option value="1">1 minute</option><option value="2">2 minutes</option><option selected="selected" value="5">5 minutes</option><option value="15">15 minutes</option><option value="30">30 minutes</option></select>';
        fv += '<br />';
    
        fv += '<input type="checkbox" name="display_new_tweets_with_growl" checked="checked" value="1" id="display_new_tweets_with_growl"> <label for="display_new_tweets_with_growl">Display New Tweets with Growl</label>';
        fv += '<br />';
        fv += '<input type="checkbox" name="beep_on_new_tweets" checked="checked" value="1" id="beep_on_new_tweets"> <label for="beep_on_new_tweets">Beep on new Tweets</label>';
        fv += '<br />';
        
        fv += '</form>';    
    $('timeline').next('div.bottom_nav').insert({bottom:fv});
    $('fluid_twitter_config').observe('change', function(){
      this.changeConfig();
    }.bind(this));
  },
  
  changeConfig: function(){
    this.growl("FluidTwitterPlus", "Config Changed");
    this.seconds_to_refresh = $F('fluid_reload') * 60;
    
    this.show_updates_with_growl = $F('display_new_tweets_with_growl') ? true : false;
    this.beep_on_update =          $F('beep_on_new_tweets') ? true : false;
    
    this.refreshTwitter();
  },
  
  refreshTwitter: function() {
    this.XHRNewTweets();
    this.new_tweets_to_view = true;
    if(this.debug) this.growl("Refreshing","!");
    this.updateBadge();
    this.discoverNewTweets();
    setTimeout(this.refreshTwitter.bind(this), this.seconds_to_refresh * 1000);
  },

  observeAppFocus: function(){
    if(this.debug) this.growl('Load', 'observeAppFocus loaded');
    Event.observe(document,'mousemove', function(){
      if(this.new_tweets_to_view){
        this.latest_seen_id = this.xhrTweets()[0].id;
        if(this.debug) this.growl('DOM', 'mousemove');
        this.updateBadge();
        this.new_tweets_to_view = false;
      }
    }.bind(this));
  },

  newTweets: function(){
    return this.newTweetsFrom(this.latest_seen_id);
  },

  newTweetsFrom: function(id){
    var last_seen = 0;
    var tweets = this.xhrTweets();
    for(var i=0; i<tweets.length; i++){
      if(tweets[i].id == id){
        return tweets.slice(0,i);
      }
    }
    return [];
  },

  updateBadge: function(){
    if (this.newTweets().length == 0) {
      window.fluid.dockBadge = "";
    } else if( this.newTweets().length >= 20){
      window.fluid.dockBadge = "20+"
    } else {
      window.fluid.dockBadge = this.newTweets().length;
    }

  },

  discoverNewTweets: function(){
    this.newTweetsFrom(this.latest_growled_id).each(function(tweet){
      if(this.show_updates_with_growl){
        var name = tweet.down('strong a').title;
        var display_name = tweet.down('strong a').innerHTML.strip();
        var tweet = tweet.down('.entry-content').innerHTML.strip().stripTags().truncate(100);
        
        this.growl(display_name,tweet);
      }
      
      if(this.beep_on_update){
        window.fluid.beep();
      }
      
      this.pushToTimeline(tweet);
      
      this.latest_growled_id = tweet.id;
    }.bind(this));
  },
  
  pushToTimeline: function(tweet){
    this.growl("pushing", "to timeline " + $(tweet).id);  
    // var new_tweet = '<tr id="new_'+$(tweet).id+'" style="display:snone;" class = "' + $(tweet).classNames().join(' ') + '">' + $(tweet).innerHTML + '</tr>';
    // this.timeline_body.insert({top:new_tweet});
        
    // this.growl("pushing", "done");
    
    // $(tweet).hide();
    // $('timeline-body').insert({top:$(tweet)});

  },
  
  staleTweets: function(){
    return $('timeline').select('.status');
  },

  xhrTweets: function(){
    var tweets = $('fake_timeline').select('.status');
    return tweets;
  },

  growl: function(title_string, messages){
  window.fluid.showGrowlNotification({
      title: title_string, 
      description: messages
    });
  },
  
  // ----------------------------------------------------------------------
  
  setupFakeTimeline: function(){
    if(this.debug) this.growl("2.0", "Setup fake timeline");
    $('home').insert({bottom:'<div id="fake_timeline" style="display:none;"></div>'});
    
    // eval('function put_in_fake_timeline(response){var nr = response.sub(\'"timeline"\',\'"fake_timeline"\');eval(nr);}');
    window.put_in_fake_timeline = function(response){ 
                                             // alert(response);
                                             var nr = response.sub('replace', 'update').sub('window.scroll(0,0);','').sub('"timeline"','"fake_timeline"') ;
                                             eval(nr);
                                            }
    
    
    this.auth_token = $F('authenticity_token');
    if(this.debug) this.growl("Auth token", "Found auth token: " + this.auth_token);
  },
  
  
  XHRNewTweets: function(){
    if(this.debug) this.growl("XHR", "fetching");
    this.growl("XHR", "Fetch")
    new Ajax.Request('http://twitter.com/home', 
                    { asynchronous:true,
                      evalScripts:false,
                      parameters:'authenticity_token=' + encodeURIComponent($F('authenticity_token')), 
                      onSuccess: function(transport) {put_in_fake_timeline(transport.responseText);}
                    });
  }
  
  
  
 
});

(function() {
  document.fluid_twitter = new FluidTwitterPlus();
})();    
