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
  seconds_to_refresh: 60 * 5,
  new_tweets_to_view: true,
  latest_growled_id: "",
  latest_seen_id: "",
  show_updates_with_growl: true,
  beep_on_update: true,
  me: "",
  debug: false,

  initialize: function() {
    this.latest_seen_id =    this.tweets()[0].id;
    this.latest_growled_id = this.tweets()[0].id;
    this.me = $$('meta[name=session-user-screen_name]').first().content;
    setTimeout(this.refreshTwitter.bind(this), this.seconds_to_refresh * 1000);
    this.buildConfig();
    this.observeAppFocus();
    this.refreshTwitter();
  },
  
  buildConfig: function() {
    if(this.debug) this.growl("buildConfig", "building");
    var fv = '<form id="fluid_twitter_config" style="margin-top:10px;">';

        fv += '<label for="fluid_reload">Refresh every </label>';
        fv += '<select name="fluid_reload" id="fluid_reload"><option value="1">1 minute (debug only)</option><option selected="selected" value="5">5 minutes</option><option value="15">15 minutes</option><option value="30">30 minutes</option></select>';
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
    $('home_tab').onclick();
    this.new_tweets_to_view = true;
    if(this.debug) this.growl("Refreshing","!");
    this.updateBadge();
    this.beeper();
    this.growlize();
    setTimeout(this.refreshTwitter.bind(this), this.seconds_to_refresh * 1000);
  },

  observeAppFocus: function(){
    if(this.debug) this.growl('Load', 'observeAppFocus loaded');
    Event.observe(document,'mousemove', function(){
      if(this.new_tweets_to_view){
        this.latest_seen_id = this.tweets()[0].id;
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
    var tweets = this.tweets();
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

  growlize: function(){
    this.newTweetsFrom(this.latest_growled_id).each(function(tweet){
      var name = tweet.down('strong a').title;
      var display_name = tweet.down('strong a').innerHTML.strip();
      var tweet = tweet.down('.entry-content').innerHTML.strip().stripTags().truncate(100);
      if(this.show_updates_with_growl) this.growl(display_name,tweet);
      this.latest_growled_id = tweet.id;
    }.bind(this));
  },
  
  beeper: function(){
    if(this.debug) this.growl("Beeper", "checking to beep");
    if(this.newTweetsFrom(this.latest_growled_id).length > 0 && this.beep_on_update){
      if(this.debug) this.growl("Beeper", "BEEP!");
      window.fluid.beep();
    }
  },

  tweets: function(){
    var tweets = $('timeline_body').select('.status');
    tweets.reject(function(t){
      return (t.down('td.status-body div a').innerHTML == this.me)
    }.bind(this));
    return tweets;
  },

  growl: function(title_string, messages){
  window.fluid.showGrowlNotification({
      title: title_string, 
      description: messages
    });
  }
  
 
});

(function() {
  document.fluid_twitter = new FluidTwitterPlus();
})();    
