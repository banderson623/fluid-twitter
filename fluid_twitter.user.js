// ==UserScript==
// @name            Fluid Twitter
// @namespace       http://brionesandco.com/ryabriones
// @description     Streamline the Twitter interface to be nicer in a Fluid Instance
// @include         http://twitter.tld/*
// @version         0.1
// @author          Ryan Carmelo Briones (modified by Brian Anderson - banderson623@gmail.com)
// @homepage        http://brionesandco.com/ryabriones 
// ==/UserScript==

var FluidTwitterPlus = Class.create({
  seconds_to_refresh: 60,
  new_tweets_to_view: true,
  latest_growled_id: "",
  latest_seen_id: "",
  debug: false,

  initialize: function() {
    this.latest_seen_id =    this.tweets()[0].id;
    this.latest_growled_id = this.tweets()[0].id;

    setTimeout(this.refreshTwitter.bind(this), this.seconds_to_refresh * 1000);
    this.observeAppFocus();
  },

  refreshTwitter: function() {
    $('home_tab').onclick();
    this.new_tweets_to_view = true;
    if(this.debug) this.growl("Refreshing","!");
    this.updateBadge();
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
      this.growl(display_name,tweet);
      this.latest_growled_id = tweet.id;
    }.bind(this));
  },

  tweets: function(){
    return $('timeline_body').select('.status');
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
