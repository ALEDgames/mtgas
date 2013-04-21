<?php
$base = '/home/hosted/mogg/img/HIRES/TK/' ;
function scan($dir) {
	if ( is_dir($dir) ) {
		$result = array() ;
		foreach ( scandir($dir) as $file ) 
			if ( ( $file != '..' ) && ( $file != '.' ) )
				$result[$file] = scan($dir.'/'.$file) ;
	} else
		$result = '' ;
	return $result ;
}
die(json_encode(scan($base))) ;
?>
