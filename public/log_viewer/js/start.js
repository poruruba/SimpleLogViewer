'use strict';

//const vConsole = new VConsole();
//window.datgui = new dat.GUI();

const base_url = "http://Åyñ{ÉTÅ[ÉoÇÃURLÅz";

var vue_options = {
    el: "#top",
    mixins: [mixins_bootstrap],
    data: {
        apikey: '',
        file_list: [],
        num_of_col: 1,

        select_file: ["", ""],
        log_data: ['', ''],
        select_order: ["tail", "tail"],
        start_line: [1, 1],
        get_line: [30, 30],
        top_line: [-1, -1]
    },
    computed: {
        class_row: function () {
            return "col-sm-" + Math.floor(12 / this.num_of_col);
        }
    },
    methods: {
        check_top_line: function (index, log_data) {
            try {
                var i = 0;
                for (; ; i++)
                    if (log_data.charAt(i) != ' ' || !log_data.charAt(i))
                        break;
                var j = i;
                for (; ; j++)
                    if (log_data.charAt(j) == ' ' || !log_data.charAt(j))
                        break;
                if (i < j)
                    this.top_line[index] = Number(log_data.substring(i, j));
                else
                    this.top_line[index] = -1;
            } catch (error) {
                console.log(error);
            }
        },
        add_num: function (index, target, num) {
            if (target == 'start_line') {
                var line = this.start_line[index] + num;
                if (line < 1) line = 1;
                this.$set(this.start_line, index, line);
            } else
                if (target == 'get_line') {
                    var line = this.get_line[index] + num;
                    if (line < 1) line = 1;
                    this.$set(this.get_line, index, line);
                }
        },
        log_get_file: async function (index) {
            try {
                this.progress_open();
                var param = {
                    fname: this.select_file[index],
                };
                var blob = await do_post_blob_with_apikey(base_url + "/tail-get-file", param, this.apikey);
                Cookies.set('tail-apikey', this.apikey, { expires: 3650 });

                var url = window.URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.download = "download.zip";
                a.click();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error(error);
                alert(error);
            } finally {
                this.progress_close();
            }
        },
        log_view_file: async function (index) {
            var param = {
                fname: this.select_file[index],
                order: this.select_order[index],
                start: this.start_line[index],
                num: this.get_line[index],
            };
            try {
                var log_data = await do_post_text_with_apikey(base_url + "/tail-view-file", param, this.apikey);
                if (!log_data)
                    return;
                this.check_top_line(index, log_data);
                this.$set(this.log_data, index, log_data);
                Cookies.set('tail-apikey', this.apikey, { expires: 3650 });
            } catch (error) {
                console.error(error);
                alert(error);
            }
        },
        log_next: async function (index) {
            if (this.top_line[index] < 0)
                return;

            var start;
            if (this.select_order[index] == 'tail') {
                start = this.top_line[index] - this.get_line[index];
                if (start < 1) start = 1;
            } else if (this.select_order[index] == 'head') {
                start = this.top_line[index] + this.get_line[index];
            }
            var param = {
                fname: this.select_file[index],
                order: 'head',
                start: start,
                num: this.get_line[index],
            };
            try {
                var log_data = await do_post_text_with_apikey(base_url + "/tail-view-file", param, this.apikey);
                if (!log_data)
                    return;
                this.check_top_line(index, log_data);
                this.$set(this.log_data, index, log_data);
            } catch (error) {
                console.error(error);
                alert(error);
            }
        },
        log_prev: async function (index) {
            if (this.top_line[index] < 0)
                return;
            var start;
            if (this.select_order[index] == 'tail') {
                start = this.top_line[index] + this.get_line[index];
            } else if (this.select_order[index] == 'head') {
                start = this.top_line[index] - this.get_line[index];
                if (start < 1) start = 1;
            }
            var param = {
                fname: this.select_file[index],
                order: 'head',
                start: start,
                num: this.get_line[index],
            };
            try {
                var log_data = await do_post_text_with_apikey(base_url + "/tail-view-file", param, this.apikey);
                if (!log_data)
                    return;
                this.check_top_line(index, log_data);
                this.$set(this.log_data, index, log_data);
            } catch (error) {
                console.error(error);
                alert(error);
            }
        },
    },
    created: function () {
    },
    mounted: async function () {
        proc_load();

        this.apikey = Cookies.get('tail-apikey');

        try {
            var result = await do_post(base_url + "/tail-list", {});
            this.file_list = result.list;
            this.select_file[0] = this.file_list[0];
            this.select_file[1] = this.file_list[0];
        } catch (error) {
            console.error(error);
            alert(error);
        }
    }
};
vue_add_data(vue_options, { progress_title: '' }); // for progress-dialog
vue_add_global_components(components_bootstrap);
vue_add_global_components(components_utils);

/* add additional components */

window.vue = new Vue(vue_options);


function do_post_text_with_apikey(url, body, apikey) {
    const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "X-API-KEY": apikey });

    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: headers
    })
        .then((response) => {
            if (!response.ok)
                throw 'status is not 200';
            //            return response.json();
            return response.text();
            //    return response.blob();
            //    return response.arrayBuffer();
        });
}

function do_post_blob_with_apikey(url, body, apikey) {
    const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "X-API-KEY": apikey });

    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: headers
    })
        .then((response) => {
            if (!response.ok)
                throw 'status is not 200';
            //    return response.json();
            //    return response.text();
            return response.blob();
            //    return response.arrayBuffer();
        });
}
