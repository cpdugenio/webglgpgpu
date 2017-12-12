# Convtest
layer_1_convolution (8, 3, 3, 3) (8,)
layer_2_convolution (8, 8, 3, 3) (8,)
layer_3_convolution (16, 8, 3, 3) (16,)
layer_4_convolution (16, 16, 3, 3) (16,)
FC_1 (128, 16, 5, 5) (128,)
FC_2 (64, 128, 1, 1) (64,)
FC_3 (10, 64, 1, 1) (10,)
Softmax: [[
	0.11115292  0.09769145  0.10416672  0.12922034  0.12251567
	0.06047115  0.11467595  0.05949378  0.12955776  0.07105426]]

var layer_1_k_WHDN = { 'n': 8,    'd': 3,    'w': 3,   'h': 3, };
var layer_2_k_WHDN = { 'n': 8,    'd': 8,    'w': 3,   'h': 3, };
var layer_3_k_WHDN = { 'n': 16,   'd': 8,    'w': 3,   'h': 3, };
var layer_4_k_WHDN = { 'n': 16,   'd': 16,   'w': 3,   'h': 3, };
var FC_1_k_WHDN =    { 'n': 128,  'd': 16,   'w': 5,   'h': 5, };
var FC_2_k_WHDN =    { 'n': 64,   'd': 128,  'w': 1,   'h': 1, };
var FC_3_k_WHDN =    { 'n': 10,   'd': 64,   'w': 1,   'h': 1, };
