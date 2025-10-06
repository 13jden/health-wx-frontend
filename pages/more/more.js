Page({
  data: {
    // 可以在这里定义动态数据
    articles: [
      {
        id: 1,
        title: '新国标护航儿童营养食品...',
        desc: '近日，国家卫生健康委...',
        image: '/images/food-safety.jpg'
      },
      // 其他文章数据...
    ]
  },

  // 跳转到文章详情
  navigateToArticle: function(e) {
    const articleId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/articleDetail/articleDetail?id=${articleId}`
    });
  },

  // 点击"更多"
  onMoreClick: function() {
    wx.navigateTo({
      url: '/pages/articleList/articleList'
    });
  }
})