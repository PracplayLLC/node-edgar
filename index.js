'use strict';

// Helper libraries
var Request = require('request');
var _ = require('lodash');
var FeedParser = require('feedparser');


module.exports = {

	/** Takes company ticker or CIK **/
	getCompanyInfo: function(query, cb) {
		if(!query) { 
	    cb({ error: 'Cannot get company info without valid query!' }); 
	    return;
	  }
	  console.log("Getting company info from EDGAR...");
	  var feedURL = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=" + query + 
	                "&type=&dateb=&owner=include&start=0&count=20&output=atom";
	  var companyInfo = {};
	  // SEC feeds are Atom feeds
	  Request.get(feedURL).pipe(new FeedParser())
	    .on('error', function (error) {
	      console.log("FeedParser error!");
	      console.error(error);
	      companyInfo.error = "There was an error pulling SEC data using ticker: " + query;
	    })
	    .on('meta', function (meta) {
	      var metaInfo = meta['atom:company-info'];	      
	      if(metaInfo['conformed-name']) { companyInfo.conformed_name = metaInfo['conformed-name']['#']; }
	      if(metaInfo['addresses']) { 
	        var addressInfo;
	        if(_.isArray(metaInfo['addresses']['address'])) {
	          addressInfo = [];
	          _.forEach(metaInfo['addresses']['address'], function(obj) {    
	            var newAddress = {};       
	            _.forEach(obj, function(value, key) {
	              key === "@" ? newAddress['type'] = value['type'] : newAddress[key] = value['#'];
	            });
	            addressInfo.push(newAddress);
	          });
	        } else {
	          addressInfo = {};
	          _.forEach(metaInfo['addresses']['address'], function(value, key) { 
	            key === "@" ? addressInfo['type'] = value['type'] : addressInfo[key] = value['#'];         
	          })
	        }
	        companyInfo.addresses = addressInfo;
	      }
	      if(metaInfo['assigned-sic']) { companyInfo.assigned_sic = metaInfo['assigned-sic']['#']; }
	      if(metaInfo['assigned-sic-desc']) { companyInfo.assigned_sic_desc = metaInfo['assigned-sic-desc']['#']; }
	      if(metaInfo['assigned-sic-href']) { companyInfo.assigned_sic_href = metaInfo['assigned-sic-href']['#']; }
	      if(metaInfo['cik']) { companyInfo.cik = metaInfo['cik']['#']; }
	      if(metaInfo['cik-href']) { companyInfo.cik_href = metaInfo['cik-href']['#']; }
	      if(metaInfo['fiscal-year-end']) { companyInfo.fiscal_year_end = metaInfo['fiscal-year-end']['#']; }
	      if(metaInfo['formerly-names']) { 
	        var nameInfo;
	        if(_.isArray(metaInfo['formerly-names']['names'])) {
	          nameInfo = [];
	          _.forEach(metaInfo['formerly-names']['names'], function(obj) {
	            var newName = {};
	            _.forEach(obj, function(value, key) {
	              key === "@" ? null : newName[key] = value['#'];
	            });
	            nameInfo.push(newName);
	          });
	        } else {
	          nameInfo = {};
	          _.forEach(metaInfo['formerly-names']['names'], function(value, key) {
	            key === "@" ? null : nameInfo[key] = value['#'];
	          });
	        }
	        companyInfo.formerly_names = nameInfo; 
	      }
	      if(metaInfo['state-location']) { companyInfo.state_location = metaInfo['state-location']['#']; }
	      if(metaInfo['state-location-href']) { companyInfo.state_location_href = metaInfo['state-location-href']['#']; }
	      if(metaInfo['state-of-incorporation']) { companyInfo.state_of_incorporation = metaInfo['state-of-incorporation']['#']; }
	      // If no meta info, obj will be empty, which means somethings has gone wrong
	      if(_.isEmpty(companyInfo)) { companyInfo.error = "There was an error pulling SEC data using ticker: " + query; }
	    })
	    .on('readable', function() {
	      var stream = this, item;
	      while (item = stream.read()) {
	        // THIS WHILE LOOP IS NECESSARY TO END STREAM
	      }
	    })
	    .on('end', function() {     
	      cb(companyInfo);        
	    });
	},


	/** Query should be either ticker or CIK; number of filings must be in increments of 20 **/
	getFilings: function(query, numFilings, cb) {
		if(!query) { 
	    cb({ error: 'Cannot get SEC filings info without valid query!' }); 
	    return;
	  }
	  var filingCount = 20;
	  if(numFilings && (typeof numFilings === 'number') && numFilings >= 0) { filingCount = numFilings; } 
	  console.log("Getting SEC filings info from EDGAR...");
	  var feedURL = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=" + query + 
	                "&type=&dateb=&owner=include&start=0&count=" + filingCount + "&output=atom";
	  var secFeedData = { info: {}, filings: [] };
	  // SEC feeds are Atom feeds
	  Request.get(feedURL).pipe(new FeedParser())
	    .on('error', function (error) {
	      console.log("FeedParser error!");
	      console.error(error);
	      secFeedData.error = "There was an error pulling SEC data using ticker: " + query;
	    })
	    .on('meta', function (meta) {
	      var metaInfo = meta['atom:company-info'];
	      if(metaInfo['conformed-name']) { secFeedData.info.conformed_name = metaInfo['conformed-name']['#']; }
	      if(metaInfo['cik']) { secFeedData.info.cik = metaInfo['cik']['#']; }
	      if(metaInfo['cik-href']) { secFeedData.info.cik_href = metaInfo['cik-href']['#']; }
	    })
	    .on('readable', function() {
	      var stream = this, item;
	      while (item = stream.read()) {	        
	        secFeedData.filings.push({ 
	          title: item.title, 
	          href: item.link, 
	          date: item.date, 
	          summary: item.summary,
	          guid: item.guid,
	          categories: item.categories,
	          filingType: item['atom:content']['filing-type']['#'],
	          formName: item['atom:content']['form-name']['#'],
	          // Error in SEC spelling
	          accession_no: item['atom:content']['accession-nunber']['#']
	        });
	      }
	    })
	    .on('end', function() {     
	      cb(secFeedData);        
	    });
	}

};