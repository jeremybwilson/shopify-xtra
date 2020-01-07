// Override Settings : Note, custom object cant' be overriden and rquires direct modification
window.collection_count = 0;
window.promo_grid_add_count = 0;
var bcSfFilterSettings = {
    general: {
       limit: bcSfFilterConfig.custom.products_per_page,
        // Optional
        loadProductFirst: false,
        refineByHorizontalPosition: 'top',
        paginationType: "default", // PDM-216 this will work if we have "default" pagination
    	  // enable review rating by tag
      	enableReviewRatingByTag: true,
				// rating filter option id
        reviewRatingByTagFilterOptionId: ['pf_t_review_rating', 'pf_t_review_rating_list'],
				// rating tag prefix
        reviewRatingByTagTagPrefix: 'rating:',
      	extraSortingList: 'extra-sort1-descending',
    },
    selector: {
        products: '#product-loop'
    }
};

// FILTER TEMPLATES
var bcSfFilterTemplate = {

    // Grid Template
    'productGridItemHtml':  '<div class="product-index {{itemGridWidthClass}} product-impression" id="{{itemProductId}}" data-alpha="{{itemTitle}}" data-category="{{itemCollection}}" data-list="{{itemCollection}}" data-position="1" data-price2="{{itemPriceOnly}}" data-price="{{itemPriceAttr}}">' +
                                '<div class="prod-container">' +
                                    '{{itemBadge}}' +
                                    '<div class="prod-image">' +
                                        '<a href="{{itemUrl}}" title="{{itemTitle}}">' +
                                        '<div class="reveal">' +
                                            '<img id="product-image-{{itemProductId}}" src="{{itemThumbUrl}}" alt="{{itemTitle}}" />' +
                                            '{{itemFlipImage}}' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +

                                '<div class="product-info">' +
                                    '{{itemSwatch}}' +
                                    '<a class="product-title-wrap" href="{{itemUrl}}"> ' +
                                        '{{itemVendor}}' +
                                        '<h3 class="product-title">{{itemTitle}}</h3>' +
                                    '</a>' +
                                    '<div class="product-price-wrap">{{itemPrice}}</div>' +
                                    '<div class="yotpo bottomLine" data-product-id="{{itemProductId}}"></div>'+
                                '</div>' +
                                '{{itemQuickview}}' +
                            '</div>',

    // Badge Template
    'itemBadgeHtml': '<div class="react-badge" data-badge=\'{{badgeTags}}\'></div>',

    // Pagination Template
    'previousHtml': '<a href="{{itemUrl}}"><i class="fa fa-angle-left" aria-hidden="true"></i></a>',
    'nextHtml': '<a href="{{itemUrl}}"><i class="fa fa-angle-right" aria-hidden="true"></i></a>',
    'pageItemHtml': '<a href="{{itemUrl}}">{{itemTitle}}</a>',
    'pageItemSelectedHtml': '<span class="current">{{itemTitle}}</span>',
    'pageItemRemainHtml': '{{itemTitle}}',
    'paginateHtml': '<span class="count"></span>{{previous}}{{pageItems}}{{next}}',

    // Sorting Template
    'sortingHtml': '<h4 class="sort-label">' + bcSfFilterConfig.label.sorting + '</h4><select aria-label="Sort By" class="styled-select">{{sortingItems}}</select>',

    // Apply Btn Template (Mobile) : Filter constructor not exposed, so func binding close not available, hence this sad click..
    'mobileApplyBtnHtml': '<button class="mobile-apply-button" onClick="$(\'#bc-sf-filter-tree-mobile-button\').click()">Apply</button>'
};



BCSfFilter.prototype.buildProductGridItem = function(data, index, totalProduct) {
    window.total_display_product = totalProduct;
    /*** Prepare data ***/
    var images = data.images_info;

    // Displaying price base on the policy of Shopify, have to multiple by 100
    var soldOut = !data.available; // Check a product is out of stock
    var onSale = data.compare_at_price_min > data.price_min; // Check a product is on sale
    var priceVaries = data.price_min != data.price_max; // Check a product has many prices

    /* HIDE ITEM : Hide if tag "hide_from_catalog" found basically
    INFO:
        If item has tag "hide_from_catalog", skip it as its a Gift w/ Purchase item
        We can't set item unavailable on sales channels if its a gift item, so this
        is solution for now to hide the item from store "all products catalogs"
    RESULTS COUNT NOTE :
        Page counts will be off by however hidden items there are, but since
        hidden items should have no collection tag assignments, it should only
        affect the "all products" collection and a num or two off shouldn't matter there.
    * --------------------------------------------------------------------------------------- */
    if ( data.tags ) {
        var hasHideFlag = data.tags.filter(function (tag) {
            return tag === 'hide_from_catalog'
        }).length

        if ( hasHideFlag ) {
            return '';
        }
    }

    // Get First Variant (selected_or_first_available_variant)
    var firstVariant = data['variants'][0];
    if (getParam('variant') !== null && getParam('variant') != '') {
        var paramVariant = data.variants.filter(function(e) { return e.id == getParam('variant'); });
        if (typeof paramVariant[0] !== 'undefined') firstVariant = paramVariant[0];

    } else {
        for (var i = 0; i < data['variants'].length; i++) {
            if (data['variants'][i].available) {
                firstVariant = data['variants'][i];
                break;
            }
        }
    }
    /*** End Prepare data ***/


    // TEMPLATE : Create unique tpl instance
    var itemHtml = bcSfFilterTemplate.productGridItemHtml;


    // CSS GRID : Add itemGridWidthClass to match row config
    var itemGridWidthClass = '';
    switch (bcSfFilterConfig.custom.products_per_row) {
        case 2: itemGridWidthClass = 'desktop-6 tablet-3 mobile-half'; break;
        case 3: itemGridWidthClass = 'desktop-4 tablet-2 mobile-half'; break;
        case 4: itemGridWidthClass = 'desktop-3 tablet-2 mobile-half'; break;
        default: break;
    }
    itemHtml = itemHtml.replace(/{{itemGridWidthClass}}/g, itemGridWidthClass);


    // BADGE : ITEM TYPE : Add Item Badge (Required Tags : item_badge_text_SOMETHING + item_badge_shape_SOMETHING)
    if ( data.tags ) {
        var findTag = function(searchString) {
            var foundTags = data.tags.filter( function( tag ) {
                return tag.indexOf( searchString ) >= 0;
            });

            return foundTags || [];
        };

        // POPULATE : Build array of tags with only the ones we want
        var badgeTags = findTag( 'item_badge_' );
        if ( badgeTags.length > 0 ) {

            // RENDER : Drop populated badge template into itemHtml template
            var itemBadgeHtml = bcSfFilterTemplate.itemBadgeHtml; //Don't modify original :)
            itemBadgeHtml = itemBadgeHtml.replace( /{{badgeTags}}/g, JSON.stringify( badgeTags ) );
            itemHtml = itemHtml.replace( /{{itemBadge}}/g, itemBadgeHtml );

        } else {
            itemHtml = itemHtml.replace(/{{itemBadge}}/g, '' ); //No badge, remove block
        }
    }


    // THUMBNAIL : Add Thumbnail template
    var itemThumbUrl = images.length > 0 ? this.optimizeImage(images[0]['src']) : bcSfFilterConfig.general.no_image_url;
    itemHtml = itemHtml.replace(/{{itemThumbUrl}}/g, itemThumbUrl);


    // IMAGE : FLIP : Add Flip Image if enabled
    var itemFlipImageHtml = '';
    if (bcSfFilterConfig.custom.image_flip && images.length > 1) {
        itemFlipImageHtml = '<div class="hidden">';
        itemFlipImageHtml += '<img src="' + this.optimizeImage(images[1]['src']) + '" alt="{{itemTitle}}" />';
        itemFlipImageHtml += '</div>';
    }
    itemHtml = itemHtml.replace(/{{itemFlipImage}}/g, itemFlipImageHtml);


    // VENDOR : Display vendor if enabled
    var itemVendorHtml = bcSfFilterConfig.custom.vendor_enable ? bcSfFilterTemplate.vendorHtml.replace(/{{itemVendorLabel}}/g, data.vendor) : '';
    itemHtml = itemHtml.replace(/{{itemVendor}}/g, itemVendorHtml);


    // PRICE : Add price and original price if discounted
    var itemPriceHtml = '';
    if (onSale) {
        itemPriceHtml += '<div class="onsale">' + this.formatMoney(data.price_min, this.moneyFormat) + '</div>';
        itemPriceHtml += '<div class="was">' + this.formatMoney(data.compare_at_price_min, this.moneyFormat) + '</div>';

    } else {
        itemPriceHtml += '<div class="prod-price">';

        if (priceVaries) {
            itemPriceHtml += bcSfFilterConfig.label.from_price + ' ' + this.formatMoney(data.price_min, this.moneyFormat) + ' - ' + this.formatMoney(data.price_max, this.moneyFormat);
        } else {
            itemPriceHtml += this.formatMoney(data.price_min, this.moneyFormat);
        }

        itemPriceHtml += '</div>';
    }
    // PDM-868 : Patch for mobile Safari regex bug
    var itemPriceRegEx = new RegExp( '{{itemPrice}}', 'g');
    itemHtml = itemHtml.replace(itemPriceRegEx, function(match) { return itemPriceHtml });

    // QUICK VIEW : Add quickview template and setup for fancybox usage
    var itemQuickviewHtml = '';
    if (bcSfFilterConfig.custom.quick_view_enable) {
        itemQuickviewHtml += '<a class="fancybox.ajax product-modal product-quickview" href="{{itemUrl}}?view=quick">' + bcSfFilterConfig.label.quick_view + '</a>';
    }
    itemHtml = itemHtml.replace(/{{itemQuickview}}/g, itemQuickviewHtml);


    // SWATCHES : Build data object for usage in react-swatches
    itemHtml = itemHtml.replace(/{{itemProductId}}/g, data.id ); //Splice in product ID
    var itemSwatchHtml = '';
    if (bcSfFilterConfig.custom.alternate_colors) {
        var optionIndex = data.options_with_values.findIndex(function(e) { return (e.name).toLowerCase() == 'color' || (e.name).toLowerCase() == 'colour'; });
        var options = data.options_with_values.filter(function(e) { return (e.name).toLowerCase() == 'color' || (e.name).toLowerCase() == 'colour'; });

        // BUILD SWATCHES : React -> SwatchParent.js : render swatches if multiple colors
        if (typeof options[0] !== 'undefined' && options[0]['values'] && options[0]['values'].length > 1 ) {
            var swatchManifest = [];

            // MANIFEST : LOOP : Build Swatch List for the Swatch List Display
            for ( var k = 0; k < options[0]['values'].length; k++ ) {
                var option = options[0]['values'][k]; //One color in the list of variant colors

                // PRODUCT IMAGE : Parent image that is displayed by default (used by hover states to reset)
                var productImgUrl = images.length > 0 ? this.optimizeImage(images[0]['src']) : bcSfFilterConfig.general.no_image_url;

                // VARIANT IMAGE : Build Variant Product Image URL for hover display of that color's image
                var imageIndex = option['image'] - 1; //Doesn't count from 0, counts from 1
                var variantImgUrl = '';
                if (typeof data['images'][imageIndex] !== 'undefined') {
                    variantImgUrl = this.optimizeImage(data['images'][imageIndex]['src']);
                }

                // SWATCH IMAGE : Build swatch image, fallback to color setting in case that fails
                var swatchImgUrl = bcSfFilterConfig.general.asset_url.replace('bc-sf-filter.js', 'swatch_' + this.slugify(option['title']) + '.png');

                // SWATCH OBJ: Single swatch object for manifest
                var colorValueName = this.slugify( option['title'] );
                var swatch = {
                    colorDisplayName: option['title'],          // NAME : Color Name that user sees in tooltip
                    colorValueName: colorValueName,             // NAME : CSS name for color style fallback
                    productId: data.id,                         // ID : Product ID
                    productImgUrl: productImgUrl,               // IMAGE : Product image original (for restoring after hover)
                    swatchId: data.id + '-' + colorValueName,   // ID : Swatch : Swatch Color Unique ID
                    swatchImgUrl: swatchImgUrl,                 // SWATCH : Image url for swatch (fallback = name as color)
                    variantImgUrl: variantImgUrl                // IMAGE : Product Variant Image for that color option
                }

                // MANIFEST : ADD : Add this swatch to the list
                swatchManifest.push( swatch );
            };

            // POPULATE : Render the react root element for each swatch list
            var swatchManifestString = JSON.stringify( swatchManifest );
            itemSwatchHtml = "<div class='react-swatch-list' data-swatches='" + swatchManifestString + "'></div>";

        // BUILD : Spacer : Only 1 color, render spacer instead of swatch list
        } else {
            itemSwatchHtml = "<div class='swatch-spacer'></div>";
        }
    }
    itemHtml = itemHtml.replace(/{{itemSwatch}}/g, itemSwatchHtml);


    // INFO : Add main attributes for product data
    itemHtml = itemHtml.replace(/{{itemPriceAttr}}/g, data.price_min);
    itemHtml = itemHtml.replace(/{{itemPriceOnly}}/g, this.formatMoney(data.price_min, this.moneyFormat)); // PDM-216
    itemHtml = itemHtml.replace(/{{itemId}}/g, data.id);
    itemHtml = itemHtml.replace(/{{itemTitle}}/g, data.title);
    itemHtml = itemHtml.replace(/{{itemHandle}}/g, data.handle);
    itemHtml = itemHtml.replace(/{{itemUrl}}/g, this.buildProductItemUrl(data));
    itemHtml = itemHtml.replace(/{{itemCollection}}/g, data.collections[0].title);// PDM-216


    // RENDER : Return out our built template!
    var collection_total_product = parseInt($("#all_products_count").val());
    if($(".product_grid_promo").length > 0){
        var current_html = "";
        $(".product_grid_promo").each(function() {
            if(
                ($( this ).length > 0 && (index + collection_count + promo_grid_add_count)  == $( this ).data('position')) ||
                (($( this ).length > 0 && collection_count == 0 &&  index == totalProduct &&  $( this ).data('position') >= collection_total_product) )
            ){
                promo_grid_add_count++;
                $( this ).show();
                $( this ).removeClass('product_grid_promo ');
                $( this ).addClass(itemGridWidthClass);
                var promo_html =  $( this ).parents('div:first').html();
                $( this ).remove();
                current_html += promo_html;
            }
        });
        if( index == totalProduct){
            collection_count += totalProduct;
        }
        return current_html + itemHtml;
    }else{
        if( index == totalProduct){
            collection_count += totalProduct;
        }
        return itemHtml;
    }
}

// Build Pagination
BCSfFilter.prototype.buildPagination = function(totalProduct) {
    if (typeof yotpo !== 'undefined') {
        //check yopto is enable or not
        yotpo.initWidgets();
        window.display_product = true;
    }
    // Get page info
    var currentPage = parseInt(this.queryParams.page);
    var totalPage = Math.ceil(totalProduct / this.queryParams.limit);

    // If it has only one page, clear Pagination
    if (totalPage == 1) {
        jQ(this.selector.pagination).html('');
        return false;
    }

    if (this.getSettingValue('general.paginationType') == 'default') {
        var paginationHtml = bcSfFilterTemplate.paginateHtml;

        // Build Previous
        var previousHtml = (currentPage > 1) ? bcSfFilterTemplate.previousHtml : '';
        previousHtml = previousHtml.replace(/{{itemUrl}}/g, this.buildToolbarLink('page', currentPage, currentPage - 1));
        paginationHtml = paginationHtml.replace(/{{previous}}/g, previousHtml);

        // Build Next
        var nextHtml = (currentPage < totalPage) ? bcSfFilterTemplate.nextHtml : '';
        nextHtml = nextHtml.replace(/{{itemUrl}}/g, this.buildToolbarLink('page', currentPage, currentPage + 1));
        paginationHtml = paginationHtml.replace(/{{next}}/g, nextHtml);

        // Create page items array
        var beforeCurrentPageArr = [];
        for (var iBefore = currentPage - 1; iBefore > currentPage - 3 && iBefore > 0; iBefore--) {
            beforeCurrentPageArr.unshift(iBefore);
        }
        if (currentPage - 4 > 0) {
            beforeCurrentPageArr.unshift('...');
        }
        if (currentPage - 4 >= 0) {
            beforeCurrentPageArr.unshift(1);
        }
        beforeCurrentPageArr.push(currentPage);

        var afterCurrentPageArr = [];
        for (var iAfter = currentPage + 1; iAfter < currentPage + 3 && iAfter <= totalPage; iAfter++) {
            afterCurrentPageArr.push(iAfter);
        }
        if (currentPage + 3 < totalPage) {
            afterCurrentPageArr.push('...');
        }
        if (currentPage + 3 <= totalPage) {
            afterCurrentPageArr.push(totalPage);
        }

        // Build page items
        var pageItemsHtml = '';
        var pageArr = beforeCurrentPageArr.concat(afterCurrentPageArr);
        for (var iPage in pageArr) {
            if (pageArr[iPage] == '...') {
                pageItemsHtml += bcSfFilterTemplate.pageItemRemainHtml;
            } else {
                pageItemsHtml += (pageArr[iPage] == currentPage) ? bcSfFilterTemplate.pageItemSelectedHtml : bcSfFilterTemplate.pageItemHtml;
            }
            pageItemsHtml = pageItemsHtml.replace(/{{itemTitle}}/g, pageArr[iPage]);
            pageItemsHtml = pageItemsHtml.replace(/{{itemUrl}}/g, this.buildToolbarLink('page', currentPage, pageArr[iPage]));
        }
        paginationHtml = paginationHtml.replace(/{{pageItems}}/g, pageItemsHtml);

        jQ(this.selector.pagination).html(paginationHtml);
    }
};

// Build Sorting
BCSfFilter.prototype.buildFilterSorting = function() {
    if (bcSfFilterTemplate.hasOwnProperty('sortingHtml')) {
        jQ(this.selector.topSorting).html('');

        var sortingArr = this.getSortingList();
        if (sortingArr) {
            // Build content
            var sortingItemsHtml = '';
            for (var k in sortingArr) {
                if (k === 'extra-sort1-descending') {
                    sortingItemsHtml += '<option value="' + k +'">Top Rated</option>';
                } else {
                    sortingItemsHtml += '<option value="' + k +'">' + sortingArr[k] + '</option>';
                }
            }
            var html = bcSfFilterTemplate.sortingHtml.replace(/{{sortingItems}}/g, sortingItemsHtml);
            jQ(this.selector.topSorting).html(html);

            // Set current value
            jQ(this.selector.topSorting + ' select').val(this.queryParams.sort);
        }
    }
};

// Build additional attributes of product items
BCSfFilter.prototype.buildExtrasProductList = function(data) {

    // THE ONE IN THEME.JS SEEMS TO ACTUALLY DO SOMETHING,
    // NOT SURE WHAT THIS IS DOING AS NOTHING BROKE COMMENTING IT OUT..
    // if (typeof Yotpo !== 'undefined') {
    //     var api = new Yotpo.API(yotpo);
    //     api.refreshWidgets();
    // }

    // if ($(window).width() >= 769) {
    //     $('.prod-container').hover(function(){
    //         $(this).children('.product-modal').show();
    //     }, function(){
    //         $(this).children('.product-modal').hide();
    //     })

    //     // Call Fancybox for product modal + stop scroll to top
    //     $('.product-modal').fancybox({
    //         helpers: {
    //             overlay: {
    //                 locked: false
    //             }
    //         }
    //     });
    // }
};

// Build Additional Elements
BCSfFilter.prototype.buildAdditionalElements = function(data, eventType) {

    // PDM-216
    var currentPage = parseInt(this.queryParams.page);
    var position = (((currentPage - 1)*9)+1);
    $('.product-impression').each(function () {
        $(this).attr('data-position', position);
        position++;
    });

    var ui = {
        filterHeaderText: '.bc-sf-filter-block-title span', // Text for filter headers, appending the count here
        filterSetWraps: '.bc-sf-filter-option-block-list',  //Generated by filter js, DON'T store jq dom references here
        filterTreeWrap: '#bc-sf-filter-tree',
        filterWrap: '.filter-wrap-desktop',
        resultsCount: 'results-count', // Using innerHTML, lack of # intentional
        selectedInputs: 'input.selected'
    };

    // RESULTS COUNT : Render number of results in current collection
    var resultsDiv = document.getElementById( ui.resultsCount ) || {};
    resultsDiv.innerHTML = data.total_product + " Results";


    // Build number of products (BoostCommerce Code)
    var from = this.queryParams.page == 1 ? this.queryParams.page : (this.queryParams.page - 1) * this.queryParams.limit + 1;
    var to = from + data.products.length - 1;
    jQ(this.selector.bottomPagination).find('.count').html(bcSfFilterConfig.label.showing_items + ' ' + from + '-' + to + ' ' +  bcSfFilterConfig.label.pagination_of + ' ' + data.total_product);


    // APPLY (MOBILE) : Filters apply on selection, "Apply" closes menu on moble.
    var filterTreeWrap = $( ui.filterTreeWrap );
    if ( filterTreeWrap ) {
        filterTreeWrap.append( bcSfFilterTemplate.mobileApplyBtnHtml );
    }

    // HIDE 1 OPTION FILTERS : Do not show filters with one option, app doesn't seem to handle this right
    var filterData = {};
    if ( data.filter ) {
        filterData = window.filter = data.filter; //Update filter data with latest from API

    // Fallback, only initial API calls have filter data since its for the whole set of paginated data.
    } else {
        filterData = window.filter;
    }
    // HIDE : 'activeFilters' builds array of populated filters with 2+ props
    var filters =  filterData && filterData.options ? filterData.options : [];
    var activeFilters = filters.filter( function( obj ) {
        return obj.status === 'active' && obj.values && obj.values.length > 1
    });

    // TOTAL : Add data attr to determine number of filters present currently (so ipad can adjust)
    var filterWrap = $( ui.filterWrap );
    if ( filterWrap.length > 0 ) {
        visibleFilters = activeFilters.filter( function( filter ) {
            return filter.values && filter.values.length > 1;
        });
        filterWrap.attr( 'data-total-filter-count', visibleFilters.length );
    }


    // FILTER SELECTION COUNTS : Indicates how many filters in each set are selected
    var updateFilterCounts = function() {

        // SETS : If we have them, find the selected items in each and set a data-attr for the current count
        var filterSets = $( ui.filterSetWraps ) || [];
        var hasSelections = false;

        // SELECTED : Calculate which filters have selections to display an indicator
        filterSets.each( function() {
            var selections = $(this).find( ui.selectedInputs ) || [];

            // COUNT : If selections, count & store to data-selected-filter-count prop
            if ( selections.length > 0 ) {
                hasSelections = true;
                $(this).attr( 'data-selected-filter-count', selections.length ); //SET : Parent Set Wrapper block, used by 'clear' button styles
                $(this).find( ui.filterHeaderText ).attr( 'data-selected-filter-count', selections.length ); // SET : Actual Span so CSS can read value to show
            }

            // PURGE : Remove any filter with only one value available
            var id = this.dataset.id;
            var hasMultipleValues = activeFilters.find( function(active) {
                return id && id === active.filterOptionId;
            });
            if ( !hasMultipleValues ) {
                $(this).remove(); // Removal means border setups on ":first-child" still behave properly
            }
        });

        // BUTTONS : ARRANGEMENT : Indicator to tel how to style "apply" button to sit with "Clear All", which admittedly had to be a bit strangely wired
        hasSelections ? (
            $( ui.filterTreeWrap ).addClass( 'selections-active' ) // Selections present
        ) : (
            $( ui.filterTreeWrap ).removeClass( 'selections-active' ) // No selections present
        );
    }
    updateFilterCounts(); //Invoke count update on filter update


    // SWATCHES : Trigger event emit to re-render swatches
    $.event.trigger({
        type: "collectionUpdated",
        time: new Date()
    });
};


// Build Default layout
function buildDefaultLink(a,b){var c=window.location.href.split("?")[0];return c+="?"+a+"="+b}BCSfFilter.prototype.buildDefaultElements=function(a){if(bcSfFilterConfig.general.hasOwnProperty("collection_count")&&jQ("#bc-sf-filter-bottom-pagination").length>0){var b=bcSfFilterConfig.general.collection_count,c=parseInt(this.queryParams.page),d=Math.ceil(b/this.queryParams.limit);if(1==d)return jQ(this.selector.pagination).html(""),!1;if("default"==this.getSettingValue("general.paginationType")){var e=bcSfFilterTemplate.paginateHtml,f="";f=c>1?bcSfFilterTemplate.hasOwnProperty("previousActiveHtml")?bcSfFilterTemplate.previousActiveHtml:bcSfFilterTemplate.previousHtml:bcSfFilterTemplate.hasOwnProperty("previousDisabledHtml")?bcSfFilterTemplate.previousDisabledHtml:"",f=f.replace(/{{itemUrl}}/g,buildDefaultLink("page",c-1)),e=e.replace(/{{previous}}/g,f);var g="";g=c<d?bcSfFilterTemplate.hasOwnProperty("nextActiveHtml")?bcSfFilterTemplate.nextActiveHtml:bcSfFilterTemplate.nextHtml:bcSfFilterTemplate.hasOwnProperty("nextDisabledHtml")?bcSfFilterTemplate.nextDisabledHtml:"",g=g.replace(/{{itemUrl}}/g,buildDefaultLink("page",c+1)),e=e.replace(/{{next}}/g,g);for(var h=[],i=c-1;i>c-3&&i>0;i--)h.unshift(i);c-4>0&&h.unshift("..."),c-4>=0&&h.unshift(1),h.push(c);for(var j=[],k=c+1;k<c+3&&k<=d;k++)j.push(k);c+3<d&&j.push("..."),c+3<=d&&j.push(d);for(var l="",m=h.concat(j),n=0;n<m.length;n++)"..."==m[n]?l+=bcSfFilterTemplate.pageItemRemainHtml:l+=m[n]==c?bcSfFilterTemplate.pageItemSelectedHtml:bcSfFilterTemplate.pageItemHtml,l=l.replace(/{{itemTitle}}/g,m[n]),l=l.replace(/{{itemUrl}}/g,buildDefaultLink("page",m[n]));e=e.replace(/{{pageItems}}/g,l),jQ(this.selector.pagination).html(e)}}if(bcSfFilterTemplate.hasOwnProperty("sortingHtml")&&jQ(this.selector.topSorting).length>0){jQ(this.selector.topSorting).html("");var o=this.getSortingList();if(o){var p="";for(var q in o)p+='<option value="'+q+'">'+o[q]+"</option>";var r=bcSfFilterTemplate.sortingHtml.replace(/{{sortingItems}}/g,p);jQ(this.selector.topSorting).html(r);var s=void 0!==this.queryParams.sort_by?this.queryParams.sort_by:this.defaultSorting;jQ(this.selector.topSorting+" select").val(s),jQ(this.selector.topSorting+" select").change(function(a){window.location.href=buildDefaultLink("sort_by",jQ(this).val())})}}};

// Display Type : List
// Select Type  : Single
/* BCSfFilter.prototype.buildFilterOptionSingleList = function(data, filterTreeId) {
  var self = this;
  // Sort values
  if (data.hasOwnProperty('values') && (data.valueType == 'all' || this.getSettingValue('general.sortManualValues') || (data.valueType != 'all' && data.sortManualValues))) data.values = this.sortFilterOptionValue(data);
  // Build content
  var itemsContent = '';
  var fOType = data.filterType,
    fODisplayType = data.displayType,
    fOSelectType = data.selectType,
    fOId = data.filterOptionId,
    fOLabel = data.label;

  self.buildFilterOptionTagReviewRatingData(data, fOId);

  // Display Collection "All"
  if (data.filterType == 'collection' && data.activeCollectionAll) {
    var checkExistCollection = this.findIndexArray('all', data.values, 'handle');
    if (checkExistCollection == -1) {
      var collectionAll = {
        doc_count: null,
        handle: "all",
        key: 0,
        label: this.getSettingValue('label.collectionAll'),
        tags: null
      };
      data.values.unshift(collectionAll);
    }
  }
  // Loop through each option values
  for (var k in data.values) {
    itemsContent += this.buildFilterOptionSingleListData(fOType, fOId, fOLabel, fODisplayType, fOSelectType, data['values'][k], data);
  }
  // Get Template & Append to Filter Tree
  if (itemsContent != '') {
    var html = this.getTemplate('filterOptionSingleList');
    html = html.replace(/{{itemList}}/g, itemsContent);
    this.buildFilterOption(html, data, filterTreeId);
  }
};

// Display Type : List
// Select Type  : Multiple
BCSfFilter.prototype.buildFilterOptionMultipleList = function(data, filterTreeId) {
  var self = this;
  // Sort values
  if (data.hasOwnProperty('values') && (data.valueType == 'all' || this.getSettingValue('general.sortManualValues') || (data.valueType != 'all' && data.sortManualValues))) data.values = this.sortFilterOptionValue(data);
  // Reverse order values array of Percent Sale

  // Build content
  var itemsContent = '';
  var fOType = data.filterType,
    fOId = data.filterOptionId,
    fOLabel = data.label,
    fODisplayType = data.displayType,
    fOSelectType = data.selectType;

  self.buildFilterOptionTagReviewRatingData(data, fOId);

  var valuesArr = data['values'];
  if (data.filterType == 'percent_sale') valuesArr = [].concat(data.values).reverse();


  for (var k = 0; k < valuesArr.length; k++) {
    itemsContent += this.buildFilterOptionMultipleListData(fOType, fOId, fOLabel, fODisplayType, fOSelectType, valuesArr[k], data);
  }


  // Get Template & Append to Filter Tree
  if (itemsContent != '') {
    var html = this.getTemplate('filterOptionMultipleList');
    html = html.replace(/{{itemList}}/g, itemsContent);
    this.buildFilterOption(html, data, filterTreeId);
  }
};*/

// Build Filter Option item in general
BCSfFilter.prototype.buildFilterOptionItem = function(html, iLabel, iValue, fOType, fOId, fOLabel, fODisplayType, fOSelectType, fOItemValue, fOData) {
  var self = this;
  var keepValuesStatic = fOData.hasOwnProperty('keepValuesStatic') ? fOData.keepValuesStatic : false;

  // Get Title which is only text and doesn't contain "product count"
  if (fOType == 'review_ratings' && this.getSettingValue('general.ratingSelectionStyle') == 'text') {
    var title = this.getReviewRatingsLabel(fOItemValue.from);
  } else {
    var title = this.customizeFilterOptionLabel(iLabel, fOData.prefix, fOType);
  }

  // Get product number
  if (keepValuesStatic === true) var productNumber = null;
  else var productNumber = fOItemValue.hasOwnProperty('doc_count') ? fOItemValue.doc_count : 0;

  var itemLabel = this.buildFilterOptionLabel(iLabel, productNumber, fOData);
  if (self.isFilterOptionTagReviewRating(fOId)) {
    itemLabel = self.buildFilterOptionTagReviewRatingLabel(iValue, productNumber, fOData);
  }

  // Build main attributes
  html = html.replace(/{{itemLabel}}/g, itemLabel);
  html = html.replace(/{{itemLink}}/g, this.buildFilterOptionLink(fOId, iValue, fOType, fODisplayType, fOSelectType, keepValuesStatic));
  html = html.replace(/{{itemValue}}/g, encodeURIParamValue(iValue));
  html = html.replace(/{{itemTitle}}/g, title);
  html = html.replace(/{{itemFunc}}/g, "onInteractWithFilterOptionValue(event, this, '" + fOType + "', '" + fODisplayType + "', '" + fOSelectType + "', '" + keepValuesStatic + "')");
  // Check if item is selected or not
  html = this.checkFilterOptionSelected(fOId, iValue, fOType, fODisplayType) ? html.replace(/{{itemSelected}}/g, 'selected') : html.replace(/{{itemSelected}}/g, '');
  // Add additional attributes
  var htmlElement = jQ(html);
  htmlElement.children().attr({
    'data-id': fOId,
    'data-value': fOType == 'collection' ? encodeURIParamValue(iValue.split(':')[0]) : encodeURIParamValue(iValue),
    'data-parent-label': fOLabel,
    'data-title': title,
    'data-count': productNumber
  });
  // Add nofollow to all filter option links to increase SEO
  if (this.getSettingValue('general.enableSeo') && fOType != 'collection') {
    htmlElement.children().attr('rel', 'nofollow');
  }
  // Build Collection scope (for only Collection type)
  if (fOType == 'collection') htmlElement.children().attr('data-collection-scope', fOItemValue.key);
  return jQ(htmlElement)[0].outerHTML;
};

// Build Filter option Label
BCSfFilter.prototype.buildFilterOptionTagReviewRatingLabel = function(iValue, productNumber, fOData) {
  var self = this;
  // Customize label

  var ratingValue = parseInt(iValue.replace(self.getSettingValue('general.reviewRatingByTagTagPrefix'), '').trim());
  var label = '';
  label = self.buildRatingStars(ratingValue);

  // Build Labels
  var itemLabelHtml = this.getTemplate('filterOptionLabel').replace(/{{itemValue}}/g, label);

  if (this.getSettingValue('general.showFilterOptionCount') && fOData.displayType != 'box') {
    if (fOData.keepValuesStatic !== true && productNumber !== null && ((productNumber > 0 && this.getSettingValue('general.showOutOfStockOption') == false) || this.getSettingValue('general.showOutOfStockOption') == true)) {
      return itemLabelHtml.replace(/{{itemAmount}}/g, '(' + productNumber + ')');
    }
  }
  return itemLabelHtml.replace(/{{itemAmount}}/g, '');
};

BCSfFilter.prototype.buildFilterOptionTagReviewRatingData = function(data, fOId) {
  var self = this;
  // Customize Rating
  if (self.isFilterOptionTagReviewRating(fOId)) {

    var arrRatingList = [0, 1, 2, 3, 4, 5];
    var arrAvailableRatingData = data.values.map(function(value) {
      return value.key.replace(self.getSettingValue('general.reviewRatingByTagTagPrefix'), '').trim();
    });

    function differenceOf2Arrays(array1, array2) {
      var temp = [];
      array1 = array1.toString().split(',').map(Number);
      array2 = array2.toString().split(',').map(Number);

      for (var i in array1) {
        if (array2.indexOf(array1[i]) === -1) temp.push(array1[i]);
      }
      for (i in array2) {
        if (array1.indexOf(array2[i]) === -1) temp.push(array2[i]);
      }
      // :: NOTE :: commenting out ES6 syntax due to issue in SRE-2075
      // return temp.sort((a, b) => a - b);
      return temp.sort( function(a, b){
        return a - b;
      });
    }

    var unavailableRatingData = differenceOf2Arrays(arrRatingList, arrAvailableRatingData);

    if (typeof unavailableRatingData != 'undefined' && unavailableRatingData.length > 0) {
      unavailableRatingData.map(function(rating) {
        var newValue = {
          key: self.getSettingValue('general.reviewRatingByTagTagPrefix') + rating,
          doc_count: 0
        };
        data.values.push(newValue);
      });
    }

    data.values = self.sortFilterOptionValue(data);
  }

};

BCSfFilter.prototype.isFilterOptionTagReviewRating = function(fOId) {
  return this.getSettingValue('general.reviewRatingByTagFilterOptionId').indexOf(fOId) != -1 && this.getSettingValue('general.enableReviewRatingByTag') == true;
};

// Customize data to suit the data of Shopify API
BCSfFilter.prototype.prepareProductData = function(data) {
    for (var k = 0; k < data.length; k++) {
        data[k]['images'] = data[k]['images_info'];
        if (data[k]['images'].length > 0) {
            data[k]['featured_image'] = data[k]['images'][0]
        } else {
            data[k]['featured_image'] = {
                src: bcSfFilterConfig.general.no_image_url,
                width: '',
                height: '',
                aspect_ratio: 0
            }
        }
        data[k]['url'] = '/products/' + data[k].handle;

        var optionsArr = [];
        for (var i = 0; i < data[k]['options_with_values'].length; i++) {
            optionsArr.push(data[k]['options_with_values'][i]['name'])
        }

        data[k]['options'] = optionsArr;

        data[k]['price_min'] *= 100,
        data[k]['price_max'] *= 100,
        data[k]['compare_at_price_min'] *= 100,
        data[k]['compare_at_price_max'] *= 100;

        data[k]['price'] = data[k]['price_min'];
        data[k]['compare_at_price'] = data[k]['compare_at_price_min'];
        data[k]['price_varies'] = data[k]['price_min'] != data[k]['price_max'];

        var firstVariant = data[k]['variants'][0];
        if (getParam('variant') !== null && getParam('variant') != '') {
            var variantArr = data.variants ? data.variants : data[k]['variants']; //MODIFIED : This was breaking collection when ?variant=### query params were in url
            var paramVariant = variantArr.filter(
                function(e) {
                    return e.id == getParam('variant')
                }
            );

            if (typeof paramVariant[0] !== 'undefined') firstVariant = paramVariant[0]
        } else {
            for (var i = 0; i < data[k]['variants'].length; i++) {
                if (data[k]['variants'][i].available) {
                    firstVariant = data[k]['variants'][i];
                    break
                }
            }
        }

        data[k]['selected_or_first_available_variant'] = firstVariant;
        for (var i = 0; i < data[k]['variants'].length; i++) {
            var variantOptionArr = [];
            var count = 1;
            var variant = data[k]['variants'][i];
            var variantOptions = variant['merged_options'];
            if (Array.isArray(variantOptions)) {
                for (var j = 0; j < variantOptions.length; j++) {
                    var temp = variantOptions[j].split(':');
                    data[k]['variants'][i]['option' + (parseInt(j) + 1)] = temp[1];
                    data[k]['variants'][i]['option_' + temp[0]] = temp[1];
                    variantOptionArr.push(temp[1])
                }
                data[k]['variants'][i]['options'] = variantOptionArr
            }

            data[k]['variants'][i]['compare_at_price'] = parseFloat(data[k]['variants'][i]['compare_at_price']) * 100;
            data[k]['variants'][i]['price'] = parseFloat(data[k]['variants'][i]['price']) * 100
        }

        data[k]['description'] = data[k]['content'] = data[k]['body_html']
    }
    return data;
};

/*
* Name: sortLodashLikeFunc
* @param: data - Array-object (mixed) required
* @param: sortBy - string (key of object) required
* @param: isAsc - Boolean (true is asc, false is desc) optional
* return value: sorted Array-object
* */
var sortLodashLikeFunc = function (data, sortBy, isAsc) {
    var dataMap = {};
    var dataArr = [];
    var newData = [];

    if (data && data.length) {
        data.forEach(function (d) {
            // check if there is review_count property
            if (d[sortBy]) {
                if (dataMap[d[sortBy]]) {
                    dataMap[d[sortBy]].push(d);
                } else {
                    dataMap[d[sortBy]] = [d];
                    dataArr.push(d[sortBy]);
                }
            } else {
                if (dataMap[0]) {
                    dataMap[0].push(d);
                } else {
                    dataMap[0] = [d];
                    dataArr.push(0);
                }
            }
        });
    }

    dataArr.sort(function(a, b) {
        if (isAsc) {
            return a-b;
        }
        return b-a;
    });

    dataArr.forEach(function (value) {
        newData = newData.concat(dataMap[value]);
    });

    return newData;
};

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// sorting products got from server by review data
var sortProductsByReviews = function(products, isAsc) {
    var sortedByRating = sortLodashLikeFunc(products, 'review_ratings', isAsc);
    return sortLodashLikeFunc(sortedByRating, 'review_count', isAsc);
};

BCSfFilter.prototype.buildAll = function(a, b, c) {

    if (a && a.products && a.products.length) {
        // sorting products by rating and review counts
        if (getUrlParameter('sort') === 'extra-sort1-descending') {
            a.products = sortProductsByReviews(a.products, false);
        } else if (getUrlParameter('sort') === 'extra-sort1-ascending') {
            a.products = sortProductsByReviews(a.products, true);
        }
    }

    var d = this.selector.pagination,
        e = a.total_product;
    if (!0 === b && a.hasOwnProperty("filter") &&
        (
            this.buildFilterTree(a.filter.options),
            this.getSettingValue("general.showRefineBy") && this.buildFilterSelection(a),
                this.buildFilterTreeMobile(),
                this.buildFilterTreeMobileButton(a), this.buildAdditionalFilterEvent()
        ), e > 0
    ) {
        this.buildProductList(a.products, c);
        var f = this.getSettingValue("general.paginationType");
        "default" == f ? this.buildPagination(e) : (jQ(d).empty(), "load_more" == f && this.buildLoadMoreButton(e)), this.buildToolbar(), this.buildToolbarEvent(a), jQ(this.selector.filterWrapper).show();
        var g = this.selector.topNotification;
        jQ(g).length > 0 && jQ(g).empty()
    }
    jQ(this.selector.products).removeAttr("data-bc-sort"), jQ(d).show(), this.buildAdditionalElements(a, c), this.buildScrollToTop(), "collection" == c && this.buildPageInfo(a), this.isSearchPage() && (this.buildSearchResultHeader(a), this.buildSearchResultNumber(a)), this.buildRobotsMetaTag(a), this.selectFilter = !1
};
